const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is missing in Vercel Dashboard project settings.');
  }

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
    return true;
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
