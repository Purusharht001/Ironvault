const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');

const DAY_MS = 24 * 60 * 60 * 1000;

const findAccount = async (userId) => {
  const account = await Account.findOne({ userId });
  if (!account) throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
  return account;
};

// Successful ledger entries on either side of an account.
const successfulFor = (accountNumber) => ({
  status: 'SUCCESS',
  $or: [{ senderAccountNumber: accountNumber }, { receiverAccountNumber: accountNumber }],
});

const sumWhen = (field, accountNumber) => ({
  $sum: { $cond: [{ $eq: [`$${field}`, accountNumber] }, '$amountCents', 0] },
});

exports.getAccount = async (req, res) => {
  const account = await findAccount(req.user.id);
  res.json(account.toPublicJSON());
};

exports.getBalance = async (req, res) => {
  const account = await findAccount(req.user.id);
  res.json({ balanceCents: account.balanceCents, currency: account.currency });
};

// Totals for the current calendar month (UTC).
exports.getStats = async (req, res) => {
  const { accountNumber } = req.user;
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [agg] = await Transaction.aggregate([
    { $match: { ...successfulFor(accountNumber), createdAt: { $gte: periodStart } } },
    {
      $group: {
        _id: null,
        totalSentCents: sumWhen('senderAccountNumber', accountNumber),
        totalReceivedCents: sumWhen('receiverAccountNumber', accountNumber),
        transferCount: { $sum: { $cond: [{ $eq: ['$kind', 'OPENING_DEPOSIT'] }, 0, 1] } },
      },
    },
  ]);

  res.json({
    totalSentCents: agg?.totalSentCents ?? 0,
    totalReceivedCents: agg?.totalReceivedCents ?? 0,
    transferCount: agg?.transferCount ?? 0,
    periodStart,
  });
};

// Daily money in / out for the last N days, zero-filled, for the dashboard chart.
exports.getActivity = async (req, res) => {
  const { accountNumber } = req.user;
  const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 30, 1), 90);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = new Date(todayUtc - (days - 1) * DAY_MS);

  const rows = await Transaction.aggregate([
    { $match: { ...successfulFor(accountNumber), createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
        sentCents: sumWhen('senderAccountNumber', accountNumber),
        receivedCents: sumWhen('receiverAccountNumber', accountNumber),
      },
    },
  ]);

  const byDay = new Map(rows.map((r) => [r._id, r]));
  const series = Array.from({ length: days }, (_, i) => {
    const date = new Date(start.getTime() + i * DAY_MS).toISOString().slice(0, 10);
    const row = byDay.get(date);
    return { date, sentCents: row?.sentCents ?? 0, receivedCents: row?.receivedCents ?? 0 };
  });

  res.json({ days, series });
};

// Lets the sender confirm who they are paying before submitting a transfer.
exports.lookupAccount = async (req, res) => {
  const { accountNumber } = req.params;
  const account = await Account.findOne({ accountNumber, status: 'ACTIVE' }).select('userId accountNumber').lean();
  if (!account) throw new AppError(404, 'No active account with that number', 'RECIPIENT_NOT_FOUND');

  const user = await User.findById(account.userId).select('username').lean();
  res.json({
    accountNumber: account.accountNumber,
    name: user?.username ?? null,
    isSelf: account.accountNumber === req.user.accountNumber,
  });
};
