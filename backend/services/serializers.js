const User = require('../models/User');
const { TREASURY_ACCOUNT_NUMBER, TREASURY_NAME } = require('../utils/constants');

/**
 * Looks up display names for a set of account numbers in one query.
 */
const resolveAccountNames = async (accountNumbers) => {
  const unique = [...new Set(accountNumbers)].filter((n) => n !== TREASURY_ACCOUNT_NUMBER);
  const users = unique.length
    ? await User.find({ accountNumber: { $in: unique } }).select('username accountNumber').lean()
    : [];
  const names = new Map(users.map((u) => [u.accountNumber, u.username]));
  names.set(TREASURY_ACCOUNT_NUMBER, TREASURY_NAME);
  return names;
};

/**
 * Shapes a ledger entry from the perspective of `viewerAccountNumber`.
 */
const serializeTransaction = (txn, viewerAccountNumber, names = new Map()) => {
  const type = txn.senderAccountNumber === viewerAccountNumber ? 'SEND' : 'RECEIVE';
  const counterpartyAccountNumber = type === 'SEND' ? txn.receiverAccountNumber : txn.senderAccountNumber;
  return {
    id: txn._id.toString(),
    referenceId: txn.referenceId,
    type,
    kind: txn.kind || 'TRANSFER',
    senderAccountNumber: txn.senderAccountNumber,
    receiverAccountNumber: txn.receiverAccountNumber,
    counterparty: {
      accountNumber: counterpartyAccountNumber,
      name: names.get(counterpartyAccountNumber) || null,
    },
    amountCents: txn.amountCents,
    status: txn.status,
    failureReason: txn.failureReason || null,
    note: txn.note || null,
    createdAt: txn.createdAt,
    updatedAt: txn.updatedAt,
  };
};

const serializeTransactions = async (txns, viewerAccountNumber) => {
  const names = await resolveAccountNames(txns.flatMap((t) => [t.senderAccountNumber, t.receiverAccountNumber]));
  return txns.map((t) => serializeTransaction(t, viewerAccountNumber, names));
};

module.exports = { resolveAccountNames, serializeTransaction, serializeTransactions };
