import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import paymentGroupsRouter from './routes.js';
import { paymentGroupsService } from './service.js';
import { errorHandler } from '../../middleware/errorHandler.js';

vi.mock('../../lib/logger.js', () => ({ logger: { error: vi.fn() } }));

vi.mock('../../middleware/auth.js', () => ({
  authMiddleware: (
    req: { user?: { userId: string } },
    _res: unknown,
    next: () => void
  ) => {
    req.user = { userId: '507f1f77bcf86cd799439011' };
    next();
  },
}));

vi.mock('./service.js', () => ({
  paymentGroupsService: {
    list: vi.fn(),
    listArchived: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/payment-groups', paymentGroupsRouter);
  app.use(errorHandler);
  return app;
}

const group = {
  id: '507f1f77bcf86cd799439012',
  name: 'Группа',
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('payment-groups routes', () => {
  beforeEach(() => {
    vi.mocked(paymentGroupsService.list).mockReset();
    vi.mocked(paymentGroupsService.listArchived).mockReset();
    vi.mocked(paymentGroupsService.getById).mockReset();
    vi.mocked(paymentGroupsService.create).mockReset();
    vi.mocked(paymentGroupsService.update).mockReset();
    vi.mocked(paymentGroupsService.delete).mockReset();
  });

  describe('GET /api/payment-groups', () => {
    it('returns 200 and list from service', async () => {
      vi.mocked(paymentGroupsService.list).mockResolvedValue([group]);

      const res = await request(createApp())
        .get('/api/payment-groups')
        .expect(200);

      expect(res.body).toEqual([group]);
      expect(paymentGroupsService.list).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
    });

    it('returns empty array when service returns empty', async () => {
      vi.mocked(paymentGroupsService.list).mockResolvedValue([]);

      const res = await request(createApp())
        .get('/api/payment-groups')
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/payment-groups/archived', () => {
    it('returns 200 and list from listArchived', async () => {
      const archivedGroup = { ...group, archived: true };
      vi.mocked(paymentGroupsService.listArchived).mockResolvedValue([
        archivedGroup,
      ]);

      const res = await request(createApp())
        .get('/api/payment-groups/archived')
        .expect(200);

      expect(res.body).toEqual([archivedGroup]);
      expect(paymentGroupsService.listArchived).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
    });

    it('returns empty array when no archived groups', async () => {
      vi.mocked(paymentGroupsService.listArchived).mockResolvedValue([]);

      const res = await request(createApp())
        .get('/api/payment-groups/archived')
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/payment-groups/:id', () => {
    it('returns 200 and group when found', async () => {
      vi.mocked(paymentGroupsService.getById).mockResolvedValue(group);

      const res = await request(createApp())
        .get('/api/payment-groups/507f1f77bcf86cd799439012')
        .expect(200);

      expect(res.body).toEqual(group);
      expect(paymentGroupsService.getById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012'
      );
    });

    it('returns 404 when service throws NOT_FOUND', async () => {
      const { AppError } = await import('../../lib/errors.js');
      vi.mocked(paymentGroupsService.getById).mockRejectedValue(
        new AppError('Group not found', { statusCode: 404, code: 'NOT_FOUND' })
      );

      const res = await request(createApp())
        .get('/api/payment-groups/507f1f77bcf86cd799439012')
        .expect(404);

      expect(res.body).toMatchObject({
        error: 'Group not found',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('POST /api/payment-groups', () => {
    it('returns 201 and created group when body valid', async () => {
      vi.mocked(paymentGroupsService.create).mockResolvedValue(group);

      const res = await request(createApp())
        .post('/api/payment-groups')
        .send({ name: 'Группа', sortOrder: 0 })
        .expect(201);

      expect(res.body).toEqual(group);
      expect(paymentGroupsService.create).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({ name: 'Группа', sortOrder: 0 })
      );
    });

    it('returns 400 when body invalid', async () => {
      const res = await request(createApp())
        .post('/api/payment-groups')
        .send({ name: '', sortOrder: 0 })
        .expect(400);

      expect(res.body).toMatchObject({
        error: expect.any(String),
        code: expect.any(String),
      });
      expect(paymentGroupsService.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/payment-groups/:id', () => {
    it('returns 200 and updated group when body valid', async () => {
      const updated = { ...group, name: 'Обновлено' };
      vi.mocked(paymentGroupsService.update).mockResolvedValue(updated);

      const res = await request(createApp())
        .patch('/api/payment-groups/507f1f77bcf86cd799439012')
        .send({ name: 'Обновлено' })
        .expect(200);

      expect(res.body).toEqual(updated);
      expect(paymentGroupsService.update).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        expect.objectContaining({ name: 'Обновлено' })
      );
    });

    it('returns 404 when service throws NOT_FOUND', async () => {
      const { AppError } = await import('../../lib/errors.js');
      vi.mocked(paymentGroupsService.update).mockRejectedValue(
        new AppError('Group not found', { statusCode: 404, code: 'NOT_FOUND' })
      );

      const res = await request(createApp())
        .patch('/api/payment-groups/507f1f77bcf86cd799439012')
        .send({ name: 'X' })
        .expect(404);

      expect(res.body).toMatchObject({
        error: 'Group not found',
        code: 'NOT_FOUND',
      });
    });

    it('returns 400 when body invalid', async () => {
      await request(createApp())
        .patch('/api/payment-groups/507f1f77bcf86cd799439012')
        .send({ name: '' })
        .expect(400);

      expect(paymentGroupsService.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/payment-groups/:id', () => {
    it('returns 204 when deleted', async () => {
      vi.mocked(paymentGroupsService.delete).mockResolvedValue(undefined);

      await request(createApp())
        .delete('/api/payment-groups/507f1f77bcf86cd799439012')
        .expect(204);

      expect(paymentGroupsService.delete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012'
      );
    });

    it('returns 404 when service throws NOT_FOUND', async () => {
      const { AppError } = await import('../../lib/errors.js');
      vi.mocked(paymentGroupsService.delete).mockRejectedValue(
        new AppError('Group not found', { statusCode: 404, code: 'NOT_FOUND' })
      );

      const res = await request(createApp())
        .delete('/api/payment-groups/507f1f77bcf86cd799439012')
        .expect(404);

      expect(res.body).toMatchObject({
        error: 'Group not found',
        code: 'NOT_FOUND',
      });
    });
  });
});
