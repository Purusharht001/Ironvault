const mongoose = require('mongoose');

/**
 * One immutable ledger entry per money movement. The direction (SEND / RECEIVE) is not
 * stored: it depends on who is looking, so the API derives it per viewer.
 */
const transactionSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
    },
    kind: {
      type: String,
      enum: ['TRANSFER', 'OPENING_DEPOSIT'],
      default: 'TRANSFER',
    },
    senderAccountNumber: {
      type: String,
      required: true,
    },
    receiverAccountNumber: {
      type: String,
      required: true,
    },
    amountCents: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least 1 cent'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer amount',
      },
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'SUCCESS',
      index: true,
    },
    failureReason: {
      type: String,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 140,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ senderAccountNumber: 1, createdAt: -1 });
transactionSchema.index({ receiverAccountNumber: 1, createdAt: -1 });

// Ledger entries are append-only: block every update and delete path through Mongoose.
const rejectMutation = () => {
  throw new Error('Ledger entries are immutable');
};

transactionSchema.pre('save', function blockResave() {
  if (!this.isNew) rejectMutation();
});

for (const op of [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
]) {
  transactionSchema.pre(op, { document: false, query: true }, rejectMutation);
}

module.exports = mongoose.model('Transaction', transactionSchema);
