import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { connectDB, disconnectDB } from './lib/mongoose';
import { logger } from './lib/logger';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import healthRouter from './routes/health';
import apiRouter from './routes/api';
import { categoriesRouter } from './domains/categories/index.js';
import { entriesRouter } from './domains/entries/index.js';
import expensesRouter from './domains/expenses/routes.js';
import { recurringIncomeRouter } from './domains/recurring-income/index.js';
import { transactionsRouter } from './domains/transactions/index.js';
import { errorHandler, notFound } from './middleware/errorHandler';
import { rateLimiter, authRateLimiter } from './middleware/rateLimit';

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req: req => ({
        method: req.method,
        url: req.url,
        // body не логируем, чтобы не попадали пароли
      }),
    },
  })
);

app.use('/health', healthRouter);
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/recurring-income', recurringIncomeRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

// Запуск сервера
const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET environment variable is not set');
    process.exit(1);
  }
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Server is running');
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
