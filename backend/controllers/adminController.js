const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { serializeLedgerEntries } = require('../services/serializers');
const { ledgerFilterClauses, parsePagination, findLedgerPage } = require('../services/ledgerQuery');

const serializeAdminAccount = (account, username) => ({
  id: account._id.toString(),
  accountNumber: account.accountNumber,
  username: username ?? null,
  balanceCents: account.balanceCents,
  currency: account.currency,
  status: account.status,
  statusReason: account.statusReason || null,
  statusUpdatedBy: account.statusUpdatedBy ? account.statusUpdatedBy.toString() : null,
  statusUpdatedAt: account.statusUpdatedAt || null,
});

// PATCH /api/admin/accounts/:accountNumber/status  { status: 'ACTIVE' | 'FROZEN', reason? }
exports.updateAccountStatus = async (req, res) => {
  const { accountNumber } = req.params;
  const { status, reason } = req.body;

  const account = await Account.findOne({ accountNumber });
  if (!account) throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
  if (account.userId.toString() === req.user.id) {
    throw new AppError(403, 'You cannot change the status of your own account', 'SELF_STATUS_CHANGE');
  }
  if (account.status === 'CLOSED') {
    throw new AppError(409, 'Closed accounts cannot be frozen or reactivated', 'ACCOUNT_CLOSED');
  }

  const previousStatus = account.status;
  // Updating the account document write-conflicts with any in-flight transfer touching it,
  // so a transfer either commits entirely before the freeze or is retried and rejected after it.
  const updated = await Account.findOneAndUpdate(
    { _id: account._id, status: { $ne: 'CLOSED' } },
    {
      $set: {
        status,
        statusUpdatedBy: req.user.id,
        statusUpdatedAt: new Date(),
        ...(reason ? { statusReason: reason } : {}),
      },
      ...(reason ? {} : { $unset: { statusReason: 1 } }),
    },
    { returnDocument: 'after', runValidators: true }
  );
  if (!updated) throw new AppError(409, 'Account status changed concurrently. Please retry', 'CONFLICT');

  const owner = await User.findById(updated.userId).select('username').lean();
  console.info(
    `[admin] ${req.user.email} changed account ${accountNumber} status ${previousStatus} -> ${status}` +
      (reason ? ` (reason: ${reason})` : '')
  );

  res.json({
    success: true,
    message: status === 'FROZEN' ? 'Account frozen' : 'Account reactivated',
    previousStatus,
    account: serializeAdminAccount(updated, owner?.username),
  });
};

// GET /api/admin/transactions  — every ledger entry in the bank, for compliance auditing.
// Filters: status, accountNumber (either party), rangeType, search, page, limit.
exports.listAllTransactions = async (req, res) => {
  const { accountNumber } = req.query;

  const clauses = ledgerFilterClauses(req.query);
  if (accountNumber) {
    clauses.push({ $or: [{ senderAccountNumber: accountNumber }, { receiverAccountNumber: accountNumber }] });
  }

  const { docs, ...pageInfo } = await findLedgerPage(Transaction, clauses, parsePagination(req.query));
  res.json({ transactions: await serializeLedgerEntries(docs), ...pageInfo });
};
