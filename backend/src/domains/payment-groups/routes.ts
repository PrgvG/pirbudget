/**
 * Роуты CRUD для групп платежей.
 * Требуют авторизации; все операции привязаны к userId из JWT.
 */

import { Router, Response, NextFunction } from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';
import { wrapAsync } from '../../middleware/asyncHandler.js';
import { paymentGroupsService } from './service.js';
import {
  validatePaymentGroupCreate,
  validatePaymentGroupUpdate,
} from './validation.js';
import { AppError } from '../../lib/errors.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      const userId = req.user!.userId;
      const list = await paymentGroupsService.list(userId);
      res.json(list);
    }
  )
);

router.get(
  '/:id',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const userId = req.user!.userId;
      const id = req.params.id;
      try {
        const group = await paymentGroupsService.getById(userId, id);
        res.json(group);
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 404) {
          res.status(404).json({ error: err.message, code: err.code });
          return;
        }
        next(err);
      }
    }
  )
);

router.post(
  '/',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const validation = validatePaymentGroupCreate(req.body);
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
      const created = await paymentGroupsService.create(
        userId,
        validation.data
      );
      res.status(201).json(created);
    }
  )
);

router.patch(
  '/:id',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const validation = validatePaymentGroupUpdate(req.body);
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
      const id = req.params.id;
      try {
        const updated = await paymentGroupsService.update(
          userId,
          id,
          validation.data
        );
        res.json(updated);
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 404) {
          res.status(404).json({ error: err.message, code: err.code });
          return;
        }
        next(err);
      }
    }
  )
);

router.delete(
  '/:id',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const userId = req.user!.userId;
      const id = req.params.id;
      try {
        await paymentGroupsService.delete(userId, id);
        res.status(204).send();
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 404) {
          res.status(404).json({ error: err.message, code: err.code });
          return;
        }
        next(err);
      }
    }
  )
);

export default router;
