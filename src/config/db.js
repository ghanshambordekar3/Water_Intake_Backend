const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/water_intake_tracker';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Auto-seed default Admin and User if DB is empty
    try {
      const User = require('../models/user.model');
      const IntakeLog = require('../models/intake.model');
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

        const today = new Date();
        await IntakeLog.create([
          { user: demoUser._id, amount: 500, note: 'Morning Hydration', date: new Date(today.setHours(8, 30, 0, 0)) },
          { user: demoUser._id, amount: 250, note: 'Post Workout Glass', date: new Date(today.setHours(11, 0, 0, 0)) },
          { user: demoUser._id, amount: 500, note: 'Lunchtime Bottle', date: new Date(today.setHours(13, 15, 0, 0)) },
        ]);

        console.log('[Auto-Seed] Successfully created default Admin & User accounts.');
      }
    } catch (seedErr) {
      console.warn('[Auto-Seed Warning]', seedErr.message);
    }
  } catch (error) {
    console.warn(`[Database] MongoDB connection error (${error.message}).`);
    // In local dev fallback to memory server if installed
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const inMemoryUri = mongoServer.getUri();
        await mongoose.connect(inMemoryUri);
        isConnected = true;
        console.log(`[Database] Mongo Memory Server Connected.`);
      } catch (memErr) {
        console.error(`[Database Error] Could not connect to In-Memory Server:`, memErr.message);
      }
    }
  }
};

module.exports = connectDB;
