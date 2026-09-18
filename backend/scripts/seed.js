/**
 * Creates two demo users (alice and bob) so you can try transfers right away.
 * Safe to run repeatedly: existing users are left untouched.
 *
 *   npm run seed
 */
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { createUserWithAccount } = require('../services/userService');

const DEMO_PASSWORD = 'Password123!';
const DEMO_USERS = [
  { username: 'alice', email: 'alice@example.com' },
  { username: 'bob', email: 'bob@example.com' },
];

const run = async () => {
  await connectDB();

  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email });
    if (existing) {
      console.log(`• ${demo.email} already exists (account ${existing.accountNumber})`);
      continue;
    }
    const user = await createUserWithAccount({ ...demo, password: DEMO_PASSWORD });
    console.log(`✓ Created ${demo.email} (account ${user.accountNumber})`);
  }

  console.log(`\nDemo password for both users: ${DEMO_PASSWORD}`);
};

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
