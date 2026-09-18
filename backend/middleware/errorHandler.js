const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { isDuplicateKeyError } = require('../utils/mongoErrors');
const { isProduction } = require('../config/env');

const notFound = (req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, code: err.code, message: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, code: 'INVALID_JSON', message: 'Request body is not valid JSON' });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ success: false, code: 'INVALID_ID', message: `Invalid ${err.path}` });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: first?.message || err.message });
  }
  if (isDuplicateKeyError(err)) {
    return res.status(409).json({ success: false, code: 'DUPLICATE', message: 'Resource already exists' });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    code: 'SERVER_ERROR',
    message: isProduction ? 'Internal Server Error' : err.message || 'Internal Server Error',
  });
};

module.exports = { notFound, errorHandler };
