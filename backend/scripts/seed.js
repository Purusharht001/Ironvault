/**
 * Creates the demo users so you can try the app right away:
 *   alice@example.com / bob@example.com  (customers, password Password123!)
 *   admin@ironvault.com                  (admin, password AdminPassword123!)
 * Safe to run repeatedly: existing users are left untouched.
 *
 *   npm run seed
 */
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { seedDemoUsers } = require('./demoUsers');

connectDB()
  .then(() => seedDemoUsers())
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
