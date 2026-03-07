/**
 * Роуты операций (история за период).
 * Требуют авторизации; данные привязаны к userId из JWT.
 */

import { Router, Response, NextFunction } from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';
import { wrapAsync } from '../../middleware/asyncHandler.js';
import { transactionsService } from './service.js';
import { validateHistoryQuery, validatePlanQuery } from './validation.js';
import { AppError } from '../../lib/errors.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/history',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const validation = validateHistoryQuery(req.query as Record<string, unknown>);
      if (!validation.ok) {
        next(
          new AppError(validation.error, {
            statusCode: 400,
            code: validation.code,
          })
        );
        return;
      }
      const userId = req.user!.userId;
      const list = await transactionsService.getHistory({
        userId,
        ...validation.data,
      });
      res.json(list);
    }
  )
);

router.get(
  '/plan',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const validation = validatePlanQuery(req.query as Record<string, unknown>);
      if (!validation.ok) {
        next(
          new AppError(validation.error, {
            statusCode: 400,
            code: validation.code,
          })
        );
        return;
      }
      const userId = req.user!.userId;
      const list = await transactionsService.getPlan(
        userId,
        validation.data.from,
        validation.data.to
      );
      res.json(list);
    }
  )
);

export default router;
