/**
 * Роуты CRUD для записей (доходы и разовые расходы).
 */

import { Router, Response, NextFunction } from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';
import { wrapAsync } from '../../middleware/asyncHandler.js';
import { entriesService } from './service.js';
import { validateEntryCreate, validateEntryUpdate } from './validation.js';
import { AppError } from '../../lib/errors.js';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

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
      const from = req.query.from;
      const to = req.query.to;
      const type = req.query.type as string | undefined;
      const groupId = req.query.groupId as string | undefined;

      if (
        typeof from === 'string' &&
        typeof to === 'string' &&
        dateRegex.test(from) &&
        dateRegex.test(to) &&
        from <= to
      ) {
        const list = await entriesService.listByDateRange({
          userId,
          from,
          to,
          type:
            type === 'income' || type === 'expense' || type === 'all'
              ? type
              : 'all',
          groupId,
        });
        res.json(list);
      } else {
        const list = await entriesService.list(userId);
        res.json(list);
      }
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
        const entry = await entriesService.getById(userId, id);
        res.json(entry);
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
      const validation = validateEntryCreate(req.body);
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
      const created = await entriesService.create(userId, validation.data);
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
      const validation = validateEntryUpdate(req.body);
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
        const updated = await entriesService.update(
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
        await entriesService.delete(userId, id);
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
