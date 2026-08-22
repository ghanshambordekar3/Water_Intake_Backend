const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const User = require('../models/user.model');
const IntakeLog = require('../models/intake.model');

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Cleaning existing collections...');
    await User.deleteMany();
    await IntakeLog.deleteMany();

    console.log('[Seeder] Creating admin account...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@watertracker.com',
      password: 'admin123',
      role: 'admin',
      dailyGoal: 2500,
    });

    console.log('[Seeder] Creating demo user account...');
    const demoUser = await User.create({
      name: 'Alex Johnson',
      email: 'user@watertracker.com',
      password: 'user123',
      role: 'user',
      dailyGoal: 2000,
    });

    console.log('[Seeder] Creating sample intake logs for demo user...');
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    await IntakeLog.create([
      {
        user: demoUser._id,
        amount: 500,
        note: 'Morning Hydration Bottle',
        date: new Date(today.setHours(8, 30, 0, 0)),
      },
      {
        user: demoUser._id,
        amount: 250,
        note: 'Post Workout Glass',
        date: new Date(today.setHours(11, 0, 0, 0)),
      },
      {
        user: demoUser._id,
        amount: 500,
        note: 'Lunchtime Bottle',
        date: new Date(today.setHours(13, 15, 0, 0)),
      },
      {
        user: demoUser._id,
        amount: 250,
        note: 'Afternoon Tea Water',
        date: new Date(today.setHours(16, 45, 0, 0)),
      },
      // Yesterday logs
      {
        user: demoUser._id,
        amount: 500,
        note: 'Morning Water',
        date: new Date(yesterday.setHours(9, 0, 0, 0)),
      },
      {
        user: demoUser._id,
        amount: 750,
        note: 'Gym Flask',
        date: new Date(yesterday.setHours(17, 30, 0, 0)),
      },
      {
        user: demoUser._id,
        amount: 500,
        note: 'Evening Water',
        date: new Date(yesterday.setHours(20, 0, 0, 0)),
      },
      // Two days ago logs
      {
        user: demoUser._id,
        amount: 1000,
        note: 'Big Water Jug',
        date: new Date(twoDaysAgo.setHours(12, 0, 0, 0)),
      },
      {
        user: demoUser._id,
        amount: 1000,
        note: 'Evening Hydration',
        date: new Date(twoDaysAgo.setHours(19, 0, 0, 0)),
      },
    ]);

    console.log('[Seeder] Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Admin Login: admin@watertracker.com | Password: admin123');
    console.log('User Login:  user@watertracker.com  | Password: user123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]', error);
    process.exit(1);
  }
};

seedData();
