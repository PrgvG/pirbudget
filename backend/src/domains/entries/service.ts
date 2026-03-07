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
  source?: string;
  groupId?: mongoose.Types.ObjectId;
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
  if (doc.direction === 'income') {
    return {
      direction: 'income',
      id,
      amount,
      date,
      source: doc.source ?? '',
      createdAt,
      updatedAt,
      ...(note != null && { note }),
    };
  }
  return {
    direction: 'expense',
    id,
    groupId: String(doc.groupId),
    amount,
    date,
    createdAt,
    updatedAt,
    ...(note != null && { note }),
  };
}

export type ListByDateRangeParams = {
  userId: string;
  from: string;
  to: string;
  type?: 'income' | 'expense' | 'all';
  groupId?: string;
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
    const { userId, from, to, type = 'all', groupId } = params;
    const uid = toObjectId(userId);
    const filter: Record<string, unknown> = {
      userId: uid,
      date: { $gte: from, $lte: to },
    };
    if (type !== 'all') {
      filter.direction = type;
    }
    if (groupId != null && groupId.trim() !== '') {
      filter.groupId = toObjectId(groupId);
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
    const payload: Record<string, unknown> = {
      userId: uid,
      direction: data.direction,
      amount: data.amount,
      date: data.date.trim(),
      ...(data.note != null && data.note !== '' && { note: data.note.trim() }),
    };
    if (data.direction === 'income') {
      if (data.source == null || data.source.trim() === '') {
        throw new AppError('source required for income', {
          statusCode: 400,
          code: 'SOURCE_REQUIRED',
        });
      }
      payload.source = data.source.trim();
    } else {
      if (data.groupId == null) {
        throw new AppError('groupId required for expense', {
          statusCode: 400,
          code: 'GROUP_ID_REQUIRED',
        });
      }
      payload.groupId = toObjectId(data.groupId);
    }
    const doc = await EntryModel.create(payload);
    return docToEntry(doc);
  },

  async update(userId: string, id: string, data: EntryUpdate): Promise<Entry> {
    const uid = toObjectId(userId);
    const update: Record<string, unknown> = {};
    if (data.amount !== undefined) update.amount = data.amount;
    if (data.date !== undefined) update.date = data.date.trim();
    if (data.note !== undefined) update.note = data.note?.trim() ?? null;
    if (data.direction !== undefined) {
      update.direction = data.direction;
      if (data.direction === 'income') {
        if (data.source == null || data.source.trim() === '') {
          throw new AppError('source required for income', {
            statusCode: 400,
            code: 'SOURCE_REQUIRED',
          });
        }
        update.source = data.source.trim();
        update.groupId = null;
      } else {
        if (data.groupId == null) {
          throw new AppError('groupId required for expense', {
            statusCode: 400,
            code: 'GROUP_ID_REQUIRED',
          });
        }
        update.groupId = toObjectId(data.groupId);
        update.source = null;
      }
    } else {
      if (data.source !== undefined) update.source = data.source?.trim() ?? null;
      if (data.groupId !== undefined)
        update.groupId = data.groupId != null ? toObjectId(data.groupId) : null;
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
