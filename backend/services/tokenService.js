const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const issueToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      accountNumber: user.accountNumber,
      email: user.email,
      role: user.role || 'user',
      tv: user.tokenVersion ?? 0,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

module.exports = { issueToken };
