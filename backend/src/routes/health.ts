import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const isConnected = mongoose.connection.readyState === 1;

  res.json({
    status: 'ok',
    message: 'Backend is running',
    database: isConnected ? 'connected' : 'disconnected',
  });
});

export default router;
