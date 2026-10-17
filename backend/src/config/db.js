import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  try {
    // Chặn NoSQL Injection (ví dụ {"$gt": ""} trong query filter)
    mongoose.set('sanitizeFilter', true);

    const conn = await mongoose.connect(config.mongodb.uri, {
      autoIndex: config.env !== 'production',
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};
