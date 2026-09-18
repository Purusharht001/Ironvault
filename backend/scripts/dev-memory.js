/**
 * Runs the API against a throwaway in-memory MongoDB replica set, pre-seeded with
 * two demo users. No MongoDB install or Atlas cluster needed. Data is lost on exit.
 *
 *   npm run dev:memory
 */
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const start = async () => {
  console.log('Starting in-memory MongoDB replica set (first run downloads MongoDB, ~1 min)...');
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  process.env.MONGO_URI = replSet.getUri('ironvault');

  const mongoose = require('mongoose');
  const { PORT } = require('../config/env');
  const connectDB = require('../config/db');
  const app = require('../app');
  const { createUserWithAccount } = require('../services/userService');

  await connectDB();

  console.log('\nDemo users (password: Password123!)');
  for (const demo of [
    { username: 'alice', email: 'alice@example.com' },
    { username: 'bob', email: 'bob@example.com' },
  ]) {
    const user = await createUserWithAccount({ ...demo, password: 'Password123!' });
    console.log(`  ${demo.email.padEnd(20)} account ${user.accountNumber}`);
  }

  const server = app.listen(PORT, () => {
    console.log(`\nIronVault Server (in-memory DB) running on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await mongoose.disconnect();
      await replSet.stop();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
