const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/water_intake_tracker';
  
  try {
    // Attempt standard connection to MongoDB URI
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000, // 3 seconds timeout for fast fallback in dev
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[Database] Direct MongoDB connection failed (${error.message}). Attempting Mongo Memory Server fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[Database] Mongo Memory Server Connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (memErr) {
      console.error(`[Database Error] Could not connect to MongoDB or In-Memory Server:`, memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
