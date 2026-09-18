const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { JWT_SECRET } = require('../config/env');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Authorization token required', 'TOKEN_REQUIRED');
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice('Bearer '.length), JWT_SECRET);
  } catch {
    throw new AppError(401, 'Invalid or expired token', 'TOKEN_INVALID');
  }

  const user = await User.findById(decoded.id).select('username email accountNumber role isActive tokenVersion').lean();
  if (!user || !user.isActive) {
    throw new AppError(401, 'Account not found or disabled', 'TOKEN_INVALID');
  }
  if ((decoded.tv ?? 0) !== user.tokenVersion) {
    throw new AppError(401, 'Session has been revoked. Please sign in again', 'SESSION_REVOKED');
  }

  req.user = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    accountNumber: user.accountNumber,
    // Read from the database, not the token, so a role change applies on the very next request.
    role: user.role || 'user',
  };
  next();
};
