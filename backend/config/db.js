const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async (uri = MONGO_URI) => {
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy backend/.env.example to backend/.env and fill it in.');
  }

  const conn = await mongoose.connect(uri);
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  // Multi-document transactions require a replica set or sharded cluster.
  const hello = await conn.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    console.warn(
      '⚠️  MongoDB is running as a standalone server. Transfers need transactions, ' +
        'which require a replica set (MongoDB Atlas works out of the box).'
    );
  }

  // Wait for the indexes declared on the schemas (unique account numbers, TTL on idempotency keys, ...).
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));

  return conn;
};

module.exports = connectDB;
