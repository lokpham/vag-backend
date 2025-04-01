import mongoose from 'mongoose';
import env from './env.js';

export const CONNECT_DB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const CLOSE_DB = async () => { 
  await mongoose.connection.close();
  console.log(' MongoDB connection closed');
};