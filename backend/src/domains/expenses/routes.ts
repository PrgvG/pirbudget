/**
 * Роуты CRUD для расходов (разовые и повторяющиеся).
 * Требуют авторизации; все операции привязаны к userId из JWT.
 */

import { Router, Response, NextFunction } from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';
import { wrapAsync } from '../../middleware/asyncHandler.js';
import {
  instantExpensesService,
  recurringExpensesService,
} from './service.js';
import {
  validateInstantExpensePaymentCreate,
  validateInstantExpensePaymentUpdate,
  validateRecurringExpensePaymentCreate,
  validateRecurringExpensePaymentUpdate,
} from './validation.js';
import { AppError } from '../../lib/errors.js';

const router = Router();

router.use(authMiddleware);

// --- Instant ---
router.get(
  '/instant',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      const userId = req.user!.userId;
      const list = await instantExpensesService.list(userId);
      res.json(list);
    }
  )
);

router.get(
  '/instant/:id',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const userId = req.user!.userId;
      const id = req.params.id;
      try {
        const item = await instantExpensesService.getById(userId, id);
        res.json(item);
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
  '/instant',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const validation = validateInstantExpensePaymentCreate(req.body);
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
      const created = await instantExpensesService.create(
        userId,
        validation.data
      );
      res.status(201).json(created);
    }
  )
);

router.patch(
  '/instant/:id',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const validation = validateInstantExpensePaymentUpdate(req.body);
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
        const updated = await instantExpensesService.update(
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
  '/instant/:id',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const userId = req.user!.userId;
      const id = req.params.id;
      try {
        await instantExpensesService.delete(userId, id);
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

// --- Recurring ---
router.get(
  '/recurring',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      const userId = req.user!.userId;
      const list = await recurringExpensesService.list(userId);
      res.json(list);
    }
  )
);

router.get(
  '/recurring/:id',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const userId = req.user!.userId;
      const id = req.params.id;
      try {
        const item = await recurringExpensesService.getById(userId, id);
        res.json(item);
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
  '/recurring',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const validation = validateRecurringExpensePaymentCreate(req.body);
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
      const created = await recurringExpensesService.create(
        userId,
        validation.data
      );
      res.status(201).json(created);
    }
  )
);

router.patch(
  '/recurring/:id',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const validation = validateRecurringExpensePaymentUpdate(req.body);
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
        const updated = await recurringExpensesService.update(
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
  '/recurring/:id',
  wrapAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const userId = req.user!.userId;
      const id = req.params.id;
      try {
        await recurringExpensesService.delete(userId, id);
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
