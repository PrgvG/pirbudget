import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentGroupsService } from './service.js';

const mockFind = vi.fn();
const mockFindOne = vi.fn();
const mockCreate = vi.fn();
const mockFindOneAndUpdate = vi.fn();
const mockFindOneAndDelete = vi.fn();

vi.mock('./model.js', () => ({
  default: {
    find: (filter: unknown) => mockFind(filter),
    findOne: (filter: unknown) => mockFindOne(filter),
    create: (data: unknown) => mockCreate(data),
    findOneAndUpdate: (filter: unknown, update: unknown, opts: unknown) =>
      mockFindOneAndUpdate(filter, update, opts),
    findOneAndDelete: (filter: unknown) => mockFindOneAndDelete(filter),
  },
}));

const validUserId = '507f1f77bcf86cd799439011';
const validId = '507f1f77bcf86cd799439012';

function doc(overrides: Record<string, unknown> = {}) {
  return {
    _id: validId,
    name: 'Группа',
    sortOrder: 0,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('paymentGroupsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
    });
  });

  describe('list', () => {
    it('returns empty array when no groups', async () => {
      const result = await paymentGroupsService.list(validUserId);
      expect(result).toEqual([]);
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ archived: { $ne: true } })
      );
    });

    it('returns mapped groups with id and ISO dates', async () => {
      const docs = [
        doc({ _id: 'id1', name: 'A' }),
        doc({ _id: 'id2', name: 'B' }),
      ];
      mockFind.mockReturnValue({
        sort: vi
          .fn()
          .mockReturnValue({ lean: vi.fn().mockResolvedValue(docs) }),
      });

      const result = await paymentGroupsService.list(validUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'id1', name: 'A', sortOrder: 0 });
      expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result[0].updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('listArchived', () => {
    it('returns empty array when no archived groups', async () => {
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const result = await paymentGroupsService.listArchived(validUserId);

      expect(result).toEqual([]);
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ archived: true })
      );
    });

    it('returns only archived groups', async () => {
      const docs = [
        doc({ _id: 'id1', name: 'Archived A', archived: true }),
        doc({ _id: 'id2', name: 'Archived B', archived: true }),
      ];
      mockFind.mockReturnValue({
        sort: vi
          .fn()
          .mockReturnValue({ lean: vi.fn().mockResolvedValue(docs) }),
      });

      const result = await paymentGroupsService.listArchived(validUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'id1',
        name: 'Archived A',
        archived: true,
      });
    });
  });

  describe('getById', () => {
    it('returns group when found', async () => {
      const d = doc();
      mockFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(d) });

      const result = await paymentGroupsService.getById(validUserId, validId);

      expect(result).toMatchObject({
        id: validId,
        name: 'Группа',
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('throws AppError 404 when not found', async () => {
      mockFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

      await expect(
        paymentGroupsService.getById(validUserId, validId)
      ).rejects.toMatchObject({
        message: 'Group not found',
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    it('throws AppError 400 for invalid id', async () => {
      await expect(
        paymentGroupsService.getById(validUserId, 'invalid')
      ).rejects.toMatchObject({
        message: 'Invalid id',
        statusCode: 400,
        code: 'INVALID_ID',
      });
      expect(mockFindOne).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('creates and returns mapped group', async () => {
      const d = doc({ name: 'Новая', sortOrder: 1 });
      mockCreate.mockResolvedValue(d);

      const result = await paymentGroupsService.create(validUserId, {
        name: ' Новая ',
        sortOrder: 1,
      });

      expect(result).toMatchObject({
        id: validId,
        name: 'Новая',
        sortOrder: 1,
      });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Новая',
          sortOrder: 1,
        })
      );
    });

    it('passes color and icon when provided', async () => {
      mockCreate.mockResolvedValue(doc({ color: '#f00', icon: '🛒' }));

      await paymentGroupsService.create(validUserId, {
        name: 'X',
        sortOrder: 0,
        color: ' #f00 ',
        icon: ' 🛒 ',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'X',
          color: '#f00',
          icon: '🛒',
        })
      );
    });
  });

  describe('update', () => {
    it('updates and returns mapped group', async () => {
      const updated = doc({ name: 'Обновлено', sortOrder: 2 });
      mockFindOneAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(updated),
      });

      const result = await paymentGroupsService.update(validUserId, validId, {
        name: ' Обновлено ',
        sortOrder: 2,
      });

      expect(result).toMatchObject({ name: 'Обновлено', sortOrder: 2 });
    });

    it('throws AppError 404 when not found', async () => {
      mockFindOneAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      await expect(
        paymentGroupsService.update(validUserId, validId, { name: 'X' })
      ).rejects.toMatchObject({
        message: 'Group not found',
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    it('throws AppError 400 for invalid id', async () => {
      await expect(
        paymentGroupsService.update(validUserId, 'bad-id', { name: 'X' })
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_ID' });
    });
  });

  describe('delete', () => {
    it('sets archived true when document exists', async () => {
      mockFindOneAndUpdate.mockResolvedValue(doc());

      await expect(
        paymentGroupsService.delete(validUserId, validId)
      ).resolves.toBeUndefined();

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        { $set: { archived: true } },
        undefined
      );
    });

    it('throws AppError 404 when not found', async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      await expect(
        paymentGroupsService.delete(validUserId, validId)
      ).rejects.toMatchObject({
        message: 'Group not found',
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    it('throws AppError 400 for invalid id', async () => {
      await expect(
        paymentGroupsService.delete(validUserId, 'invalid')
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_ID' });
    });
  });
});
