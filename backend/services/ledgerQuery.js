const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS = { week: 7, month: 30 };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Filter clauses shared by the customer history and the admin audit log.
 * Returns an array to be combined with `$and` alongside any scoping clause.
 */
const ledgerFilterClauses = ({ status, rangeType, search }) => {
  const clauses = [];
  if (status) clauses.push({ status });
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
  return clauses;
};

const parsePagination = (query) => ({
  page: Math.max(Number.parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || 25, 1), 100),
});

/**
 * Runs a paginated, newest-first ledger query over the AND of `clauses` (none = everything).
 */
const findLedgerPage = async (Transaction, clauses, { page, limit }) => {
  const filter = clauses.length ? { $and: clauses } : {};
  const [docs, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);
  return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

module.exports = { ledgerFilterClauses, parsePagination, findLedgerPage };
