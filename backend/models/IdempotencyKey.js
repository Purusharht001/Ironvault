const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  // Hash of the request body, so a key reused with different parameters is rejected
  // instead of silently replaying an unrelated response.
  requestHash: {
    type: String,
    required: true,
  },
  responseStatus: {
    type: Number,
    required: true,
  },
  responseBody: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800, // TTL index: MongoDB deletes keys after 7 days
  },
});

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
