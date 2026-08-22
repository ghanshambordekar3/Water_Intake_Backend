const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');

// Load environment variables
dotenv.config();

const app = express();

// Body parsers & CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serverless DB Middleware - Ensure DB connection before processing requests
app.use(async (req, res, next) => {
  if (req.path === '/') {
    return next(); // Health check can run without DB
  }

  try {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Database Connection Fail: MONGO_URI environment variable is missing or invalid on Vercel Dashboard.',
      });
    }
    next();
  } catch (err) {
    console.error('[DB Middleware Error]', err.message);
    return res.status(500).json({
      success: false,
      message: `Database Connection Error: ${err.message}`,
    });
  }
});

// API Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Water Intake Tracker API is running smoothly 🚀',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      intake: '/api/intake',
    },
  });
});

// Route Imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const intakeRoutes = require('./routes/intake.routes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/intake', intakeRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Server] Water Intake Tracker Backend running on port ${PORT}`);
  });
}

module.exports = app;
