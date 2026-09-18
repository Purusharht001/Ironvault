const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { CLIENT_ORIGINS } = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// The API is called cross-origin by the Next.js app; CORS below decides which origins may read it.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: CLIENT_ORIGINS,
    credentials: true,
    exposedHeaders: ['Idempotent-Replayed'],
  })
);
app.use(express.json({ limit: '10kb' }));

// Health checks
const health = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'IronVault Engine is Live! 🚀',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
};
app.get('/', health);
app.get('/api/health', health);

// Routes
app.use('/api', apiLimiter);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/account', require('./routes/accountRoutes'));
app.use('/api/transfers', require('./routes/transferRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
