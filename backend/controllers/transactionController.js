const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { serializeTransactions } = require('../services/serializers');
const { ledgerFilterClauses, parsePagination, findLedgerPage } = require('../services/ledgerQuery');

// What an account may see: everything it sent (including failed attempts)
// and successful transfers it received.
const visibleTo = (accountNumber) => ({
  $or: [{ senderAccountNumber: accountNumber }, { receiverAccountNumber: accountNumber, status: 'SUCCESS' }],
});

exports.listTransactions = async (req, res) => {
  const { accountNumber } = req.user;
  const { type } = req.query;

  const clauses = [visibleTo(accountNumber), ...ledgerFilterClauses(req.query)];
  if (type === 'SEND') clauses.push({ senderAccountNumber: accountNumber });
  if (type === 'RECEIVE') clauses.push({ receiverAccountNumber: accountNumber });

  const { docs, ...pageInfo } = await findLedgerPage(Transaction, clauses, parsePagination(req.query));
  res.json({ transactions: await serializeTransactions(docs, accountNumber), ...pageInfo });
};

exports.getTransaction = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, 'Invalid transaction id', 'INVALID_ID');

  const txn = await Transaction.findOne({ $and: [{ _id: id }, visibleTo(req.user.accountNumber)] }).lean();
  if (!txn) throw new AppError(404, 'Transaction not found', 'NOT_FOUND');

  const [serialized] = await serializeTransactions([txn], req.user.accountNumber);
  res.json(serialized);
};
