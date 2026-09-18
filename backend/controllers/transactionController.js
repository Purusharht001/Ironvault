const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { serializeTransactions } = require('../services/serializers');

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS = { week: 7, month: 30 };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// What an account may see: everything it sent (including failed attempts)
// and successful transfers it received.
const visibleTo = (accountNumber) => ({
  $or: [{ senderAccountNumber: accountNumber }, { receiverAccountNumber: accountNumber, status: 'SUCCESS' }],
});

exports.listTransactions = async (req, res) => {
  const { accountNumber } = req.user;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
  const { status, search, rangeType, type } = req.query;

  const clauses = [visibleTo(accountNumber)];
  if (status) clauses.push({ status });
  if (type === 'SEND') clauses.push({ senderAccountNumber: accountNumber });
  if (type === 'RECEIVE') clauses.push({ receiverAccountNumber: accountNumber });
  if (RANGE_DAYS[rangeType]) {
    clauses.push({ createdAt: { $gte: new Date(Date.now() - RANGE_DAYS[rangeType] * DAY_MS) } });
  }
  if (search && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    clauses.push({
      $or: [
        { referenceId: pattern },
        { senderAccountNumber: pattern },
        { receiverAccountNumber: pattern },
        { note: pattern },
      ],
    });
  }

  const filter = { $and: clauses };
  const [docs, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    transactions: await serializeTransactions(docs, accountNumber),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

exports.getTransaction = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, 'Invalid transaction id', 'INVALID_ID');

  const txn = await Transaction.findOne({ $and: [{ _id: id }, visibleTo(req.user.accountNumber)] }).lean();
  if (!txn) throw new AppError(404, 'Transaction not found', 'NOT_FOUND');

  const [serialized] = await serializeTransactions([txn], req.user.accountNumber);
  res.json(serialized);
};
