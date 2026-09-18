const { executeTransfer } = require('../services/transferService');

exports.createTransfer = async (req, res) => {
  const { toAccountNumber, amountCents, referenceId, note } = req.body;

  const { status, body, replayed } = await executeTransfer({
    userId: req.user.id,
    senderAccountNumber: req.user.accountNumber,
    toAccountNumber,
    amountCents,
    referenceId,
    note,
  });

  if (replayed) res.set('Idempotent-Replayed', 'true');
  res.status(status).json(body);
};
