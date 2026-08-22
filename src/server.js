const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Body parsers & CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auto-seed default Admin and User accounts if DB is empty
const autoSeedIfEmpty = async () => {
  try {
    const User = require('./models/user.model');
    const IntakeLog = require('./models/intake.model');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Auto-Seed] Empty database detected. Seeding initial accounts...');
      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@watertracker.com',
        password: 'admin123',
        role: 'admin',
        dailyGoal: 2500,
      });

      const demoUser = await User.create({
        name: 'Alex Johnson',
        email: 'user@watertracker.com',
        password: 'user123',
        role: 'user',
        dailyGoal: 2000,
      });

      // Add default logs
      const today = new Date();
      await IntakeLog.create([
        { user: demoUser._id, amount: 500, note: 'Morning Hydration', date: new Date(today.setHours(8, 30, 0, 0)) },
        { user: demoUser._id, amount: 250, note: 'Post Workout Glass', date: new Date(today.setHours(11, 0, 0, 0)) },
        { user: demoUser._id, amount: 500, note: 'Lunchtime Bottle', date: new Date(today.setHours(13, 15, 0, 0)) },
      ]);

      console.log('[Auto-Seed] Successfully created default Admin & User accounts.');
    }
  } catch (err) {
    console.warn('[Auto-Seed Warning]', err.message);
  }
};

setTimeout(autoSeedIfEmpty, 2000);

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

const server = app.listen(PORT, () => {
  console.log(`[Server] Water Intake Tracker Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`[Unhandled Rejection] Error: ${err.message}`);
});

module.exports = app;
