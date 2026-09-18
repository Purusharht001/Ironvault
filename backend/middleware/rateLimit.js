const rateLimit = require('express-rate-limit');
const { isTest } = require('../config/env');

const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: { success: false, code: 'RATE_LIMITED', message },
  });

module.exports = {
  apiLimiter: limiter(60 * 1000, 300, 'Too many requests. Please slow down'),
  authLimiter: limiter(15 * 60 * 1000, 30, 'Too many authentication attempts. Try again in 15 minutes'),
  transferLimiter: limiter(60 * 1000, 30, 'Too many transfers. Please wait a minute and try again'),
};
