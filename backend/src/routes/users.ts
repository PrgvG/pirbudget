import { Router, Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { wrapAsync } from '../middleware/asyncHandler';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const router = Router();

router.get(
  '/',
  authMiddleware,
  wrapAsync(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT)
      );
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find().skip(skip).limit(limit).lean(),
        User.countDocuments(),
      ]);

      res.json({ users, total, page, limit });
    }
  )
);

export default router;
