/**
 * Доменный сервис записей (доходы и разовые расходы).
 */

import mongoose from 'mongoose';
import type { Entry, EntryCreate, EntryUpdate } from 'shared/entries';
import EntryModel from './model.js';
import { AppError } from '../../lib/errors.js';

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid id', { statusCode: 400, code: 'INVALID_ID' });
  }
  return new mongoose.Types.ObjectId(id);
}

function docToEntry(doc: {
  _id: mongoose.Types.ObjectId;
  direction: 'income' | 'expense';
  amount: number;
  date: string;
  note?: string;
  categoryId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}): Entry {
  const id = String(doc._id);
  const amount = doc.amount;
  const date = doc.date;
  const createdAt = doc.createdAt.toISOString();
  const updatedAt = doc.updatedAt.toISOString();
  const note =
    doc.note != null && doc.note !== '' ? doc.note : undefined;
  const categoryId = String(doc.categoryId);
  return {
    direction: doc.direction,
    id,
    amount,
    date,
    categoryId,
    createdAt,
    updatedAt,
    ...(note != null && { note }),
  } as Entry;
}

export type ListByDateRangeParams = {
  userId: string;
  from: string;
  to: string;
  type?: 'income' | 'expense' | 'all';
  categoryId?: string;
};

export const entriesService = {
  async list(userId: string): Promise<Entry[]> {
    const uid = toObjectId(userId);
    const docs = await EntryModel.find({ userId: uid })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    return docs.map(doc => docToEntry(doc));
  },

  async listByDateRange(params: ListByDateRangeParams): Promise<Entry[]> {
    const { userId, from, to, type = 'all', categoryId } = params;
    const uid = toObjectId(userId);
    const filter: Record<string, unknown> = {
      userId: uid,
      date: { $gte: from, $lte: to },
    };
    if (type !== 'all') {
      filter.direction = type;
    }
    if (categoryId != null && categoryId.trim() !== '') {
      filter.categoryId = toObjectId(categoryId);
    }
    const docs = await EntryModel.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean();
    return docs.map(doc => docToEntry(doc));
  },

  async getById(userId: string, id: string): Promise<Entry> {
    const uid = toObjectId(userId);
    const doc = await EntryModel.findOne({
      _id: toObjectId(id),
      userId: uid,
    }).lean();
    if (!doc) {
      throw new AppError('Entry not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToEntry(doc);
  },

  async create(userId: string, data: EntryCreate): Promise<Entry> {
    const uid = toObjectId(userId);
    if (data.categoryId == null || data.categoryId.trim() === '') {
      throw new AppError('categoryId required', {
        statusCode: 400,
        code: 'CATEGORY_ID_REQUIRED',
      });
    }
    const payload = {
      userId: uid,
      direction: data.direction,
      amount: data.amount,
      date: data.date.trim(),
      categoryId: toObjectId(data.categoryId),
      ...(data.note != null && data.note !== '' && { note: data.note.trim() }),
    };
    const doc = await EntryModel.create(payload);
    return docToEntry(doc);
  },

  async update(userId: string, id: string, data: EntryUpdate): Promise<Entry> {
    const uid = toObjectId(userId);
    const update: Record<string, unknown> = {};
    if (data.amount !== undefined) update.amount = data.amount;
    if (data.date !== undefined) update.date = data.date.trim();
    if (data.note !== undefined) update.note = data.note?.trim() ?? null;
    if (data.direction !== undefined) update.direction = data.direction;
    if (data.categoryId !== undefined) {
      if (data.categoryId == null || data.categoryId.trim() === '') {
        throw new AppError('categoryId required', {
          statusCode: 400,
          code: 'CATEGORY_ID_REQUIRED',
        });
      }
      update.categoryId = toObjectId(data.categoryId);
    }

    const doc = await EntryModel.findOneAndUpdate(
      { _id: toObjectId(id), userId: uid },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) {
      throw new AppError('Entry not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToEntry(doc);
  },

  async delete(userId: string, id: string): Promise<void> {
    const uid = toObjectId(userId);
    const result = await EntryModel.findOneAndDelete({
      _id: toObjectId(id),
      userId: uid,
    });
    if (!result) {
      throw new AppError('Entry not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
  },
};
