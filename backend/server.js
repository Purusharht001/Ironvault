const mongoose = require('mongoose');
const { PORT } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`IronVault Server running on http://localhost:${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
