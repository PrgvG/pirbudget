/**
 * Доменный сервис категорий.
 * Вся работа с БД и правила владения (userId) — здесь.
 */

import mongoose from 'mongoose';
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryDirection,
} from './types.js';
import CategoryModel from './model.js';
import { AppError } from '../../lib/errors.js';

function docToCategory(doc: {
  _id: mongoose.Types.ObjectId;
  name: string;
  sortOrder: number;
  color?: string;
  icon?: string;
  archived?: boolean;
  direction: 'income' | 'expense';
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return {
    id: String(doc._id),
    name: doc.name,
    sortOrder: doc.sortOrder,
    ...(doc.color != null && { color: doc.color }),
    ...(doc.icon != null && { icon: doc.icon }),
    ...(doc.archived === true && { archived: true }),
    direction: doc.direction,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid id', { statusCode: 400, code: 'INVALID_ID' });
  }
  return new mongoose.Types.ObjectId(id);
}

export const categoriesService = {
  async list(
    userId: string,
    direction?: CategoryDirection
  ): Promise<Category[]> {
    const uid = toObjectId(userId);
    const filter: Record<string, unknown> = {
      userId: uid,
      archived: { $ne: true },
    };
    if (direction != null) {
      filter.direction = direction;
    }
    const docs = await CategoryModel.find(filter)
      .sort({ direction: 1, sortOrder: 1 })
      .lean();
    return docs.map(doc => docToCategory(doc));
  },

  async listArchived(
    userId: string,
    direction?: CategoryDirection
  ): Promise<Category[]> {
    const uid = toObjectId(userId);
    const filter: Record<string, unknown> = {
      userId: uid,
      archived: true,
    };
    if (direction != null) {
      filter.direction = direction;
    }
    const docs = await CategoryModel.find(filter)
      .sort({ direction: 1, sortOrder: 1 })
      .lean();
    return docs.map(doc => docToCategory(doc));
  },

  async getById(userId: string, id: string): Promise<Category> {
    const uid = toObjectId(userId);
    const doc = await CategoryModel.findOne({
      _id: toObjectId(id),
      userId: uid,
    }).lean();
    if (!doc) {
      throw new AppError('Category not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToCategory(doc);
  },

  async create(userId: string, data: CategoryCreate): Promise<Category> {
    const uid = toObjectId(userId);
    const doc = await CategoryModel.create({
      userId: uid,
      name: data.name.trim(),
      sortOrder: data.sortOrder,
      direction: data.direction,
      ...(data.color != null &&
        data.color !== '' && { color: data.color.trim() }),
      ...(data.icon != null && data.icon !== '' && { icon: data.icon.trim() }),
    });
    return docToCategory(doc);
  },

  async update(
    userId: string,
    id: string,
    data: CategoryUpdate
  ): Promise<Category> {
    const uid = toObjectId(userId);
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name.trim();
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
    if (data.color !== undefined) update.color = data.color?.trim() ?? null;
    if (data.icon !== undefined) update.icon = data.icon?.trim() ?? null;
    if (data.direction !== undefined) update.direction = data.direction;

    const doc = await CategoryModel.findOneAndUpdate(
      { _id: toObjectId(id), userId: uid },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) {
      throw new AppError('Category not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToCategory(doc);
  },

  async delete(userId: string, id: string): Promise<void> {
    const uid = toObjectId(userId);
    const result = await CategoryModel.findOneAndUpdate(
      { _id: toObjectId(id), userId: uid },
      { $set: { archived: true } }
    );
    if (!result) {
      throw new AppError('Category not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
  },
};
