import 'dotenv/config';
import mongoose from 'mongoose';
import { logger } from './logger';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(databaseUrl);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(error, 'MongoDB connection error');
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error(error, 'MongoDB disconnection error');
    throw error;
  }
};

mongoose.connection.on('error', error => {
  logger.error(error, 'MongoDB connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.info('MongoDB disconnected');
});

export default mongoose;
