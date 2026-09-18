const mongoose = require('mongoose');
const { ACCOUNT_NUMBER_REGEX } = require('../utils/constants');

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      match: ACCOUNT_NUMBER_REGEX,
    },
    balanceCents: {
      type: Number,
      required: true,
      min: [0, 'Insufficient balance'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer balance',
      },
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FROZEN', 'CLOSED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

accountSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    accountNumber: this.accountNumber,
    balanceCents: this.balanceCents,
    currency: this.currency,
    status: this.status,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Account', accountSchema);
