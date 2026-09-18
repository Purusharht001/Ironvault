/**
 * Runs the API against a throwaway in-memory MongoDB replica set, pre-seeded with
 * the demo users (alice, bob and an admin). No MongoDB install or Atlas cluster needed. Data is lost on exit.
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
  const { seedDemoUsers } = require('./demoUsers');

  await connectDB();

  console.log('\nDemo users');
  await seedDemoUsers();

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
