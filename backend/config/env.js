const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set in production');
  }
  jwtSecret = 'ironvault_dev_only_insecure_secret_change_me';
  if (NODE_ENV !== 'test') {
    console.warn('⚠️  JWT_SECRET is not set; using an insecure development secret.');
  }
}

module.exports = {
  NODE_ENV,
  isProduction,
  isTest: NODE_ENV === 'test',
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 12,
  OPENING_BALANCE_CENTS: Number.parseInt(process.env.OPENING_BALANCE_CENTS, 10) || 100000,
};
