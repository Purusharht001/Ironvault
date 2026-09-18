const crypto = require('crypto');
const mongoose = require('mongoose');
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const IdempotencyKey = require('../models/IdempotencyKey');
const AppError = require('../utils/AppError');
const { isDuplicateKeyError } = require('../utils/mongoErrors');
const { serializeTransaction } = require('./serializers');

const ENDPOINT = 'POST /api/transfers';
const TXN_OPTIONS = { readPreference: 'primary', readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } };

/**
 * A business-rule rejection (insufficient funds, unknown recipient, frozen account).
 * Unlike validation errors, these consume the reference ID and leave a FAILED ledger entry.
 */
class TransferRejected extends AppError {}

// A compliance freeze on either party blocks the transfer. Both balance updates below also
// filter on status 'ACTIVE', so a freeze that commits mid-transfer causes a write conflict,
// a retry, and this check then rejects it.
const assertNotFrozen = (account) => {
  if (account.status === 'FROZEN') {
    throw new TransferRejected(403, 'Account is frozen. Transactions are disabled.', 'ACCOUNT_FROZEN');
  }
};

const hashRequest =({ toAccountNumber, amountCents, note }) =>
  crypto.createHash('sha256').update(JSON.stringify([toAccountNumber, amountCents, note || ''])).digest('hex');

const replayFromRecord = (record, userId, requestHash) => {
  if (record.userId.toString() !== userId) {
    throw new AppError(409, 'This reference ID has already been used', 'DUPLICATE_REQUEST_KEY');
  }
  if (record.requestHash !== requestHash) {
    throw new AppError(
      422,
      'This reference ID was already used for a different transfer. Generate a new one',
      'IDEMPOTENCY_KEY_REUSED'
    );
  }
  return { status: record.responseStatus, body: record.responseBody, replayed: true };
};

const findReplay = async (key, userId, requestHash) => {
  const record = await IdempotencyKey.findOne({ key }).lean();
  return record ? replayFromRecord(record, userId, requestHash) : null;
};

const saveIdempotencyRecord = (session, { key, userId, requestHash, status, body }) =>
  IdempotencyKey.create(
    [{ key, userId, endpoint: ENDPOINT, requestHash, responseStatus: status, responseBody: body }],
    { session }
  );

/**
 * Debit sender and credit recipient inside one multi-document transaction.
 * Either both balances change and the ledger entry + idempotency record are written, or nothing is.
 */
const runTransfer = async (session, { userId, toAccountNumber, amountCents, referenceId, note, requestHash }) => {
  const sender = await Account.findOne({ userId }).session(session);
  if (!sender) throw new AppError(404, 'Sender account not found', 'ACCOUNT_NOT_FOUND');
  if (sender.accountNumber === toAccountNumber) {
    throw new AppError(400, 'Cannot transfer to your own account', 'SELF_TRANSFER');
  }
  assertNotFrozen(sender);
  if (sender.status !== 'ACTIVE') {
    throw new TransferRejected(403, `Your account is ${sender.status.toLowerCase()}`, 'ACCOUNT_NOT_ACTIVE');
  }

  const recipient = await Account.findOne({ accountNumber: toAccountNumber }).session(session);
  if (recipient) assertNotFrozen(recipient);
  if (!recipient || recipient.status !== 'ACTIVE') {
    throw new TransferRejected(404, 'Recipient account number not found', 'RECIPIENT_NOT_FOUND');
  }

  // Conditional debit: the balance check and the decrement are one atomic operation,
  // so two concurrent transfers can never both spend the same cents.
  const debit = await Account.updateOne(
    { _id: sender._id, status: 'ACTIVE', balanceCents: { $gte: amountCents } },
    { $inc: { balanceCents: -amountCents } },
    { session }
  );
  if (debit.modifiedCount !== 1) {
    throw new TransferRejected(422, 'Insufficient funds for this transfer', 'INSUFFICIENT_FUNDS');
  }

  const credit = await Account.updateOne(
    { _id: recipient._id, status: 'ACTIVE' },
    { $inc: { balanceCents: amountCents } },
    { session }
  );
  if (credit.modifiedCount !== 1) {
    throw new TransferRejected(409, 'Recipient account changed during transfer', 'RECIPIENT_UNAVAILABLE');
  }

  const [txn] = await Transaction.create(
    [
      {
        referenceId,
        kind: 'TRANSFER',
        senderAccountNumber: sender.accountNumber,
        receiverAccountNumber: recipient.accountNumber,
        amountCents,
        status: 'SUCCESS',
        note,
      },
    ],
    { session }
  );

  const recipientUser = await User.findById(recipient.userId).select('username').session(session).lean();
  const names = new Map([[recipient.accountNumber, recipientUser?.username || null]]);
  const body = {
    ...serializeTransaction(txn, sender.accountNumber, names),
    balanceAfterCents: sender.balanceCents - amountCents,
  };

  await saveIdempotencyRecord(session, { key: referenceId, userId, requestHash, status: 201, body });
  return { status: 201, body, replayed: false };
};

/**
 * Persist a FAILED ledger entry and cache the error response under the reference ID,
 * so retrying the same request returns the same answer instead of re-running it.
 */
const recordRejection = async (rejection, ctx) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const [txn] = await Transaction.create(
        [
          {
            referenceId: ctx.referenceId,
            kind: 'TRANSFER',
            senderAccountNumber: ctx.senderAccountNumber,
            receiverAccountNumber: ctx.toAccountNumber,
            amountCents: ctx.amountCents,
            status: 'FAILED',
            failureReason: rejection.message,
            note: ctx.note,
          },
        ],
        { session }
      );
      const body = {
        success: false,
        code: rejection.code,
        message: rejection.message,
        transaction: serializeTransaction(txn, ctx.senderAccountNumber),
      };
      await saveIdempotencyRecord(session, {
        key: ctx.referenceId,
        userId: ctx.userId,
        requestHash: ctx.requestHash,
        status: rejection.status,
        body,
      });
      result = { status: rejection.status, body, replayed: false };
    }, TXN_OPTIONS);
    return result;
  } finally {
    await session.endSession();
  }
};

const handleDuplicate = async (ctx) => {
  const replay = await findReplay(ctx.referenceId, ctx.userId, ctx.requestHash);
  if (replay) return replay;
  // Reference ID exists in the ledger but its idempotency record has expired (TTL).
  throw new AppError(409, 'This reference ID has already been used', 'DUPLICATE_REQUEST_KEY');
};

/**
 * Execute a transfer exactly once per reference ID.
 * Returns { status, body, replayed } — the caller sends it as the HTTP response.
 */
const executeTransfer = async ({ userId, senderAccountNumber, toAccountNumber, amountCents, referenceId, note }) => {
  const ctx = {
    userId,
    senderAccountNumber,
    toAccountNumber,
    amountCents,
    referenceId,
    note: note || undefined,
    requestHash: hashRequest({ toAccountNumber, amountCents, note }),
  };

  const replay = await findReplay(referenceId, userId, ctx.requestHash);
  if (replay) return replay;

  const session = await mongoose.startSession();
  try {
    let result;
    // withTransaction retries automatically on TransientTransactionError (e.g. write conflicts
    // from concurrent transfers touching the same account) and aborts on anything else.
    await session.withTransaction(async () => {
      result = await runTransfer(session, ctx);
    }, TXN_OPTIONS);
    return result;
  } catch (err) {
    if (err instanceof TransferRejected) {
      try {
        return await recordRejection(err, ctx);
      } catch (recordErr) {
        if (isDuplicateKeyError(recordErr)) return handleDuplicate(ctx);
        throw recordErr;
      }
    }
    if (isDuplicateKeyError(err)) return handleDuplicate(ctx);
    throw err;
  } finally {
    await session.endSession();
  }
};

module.exports = { executeTransfer, hashRequest };
