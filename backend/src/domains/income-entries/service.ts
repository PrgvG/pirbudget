/**
 * Доменный сервис поступлений (доходов).
 * Вся работа с БД и правила владения (userId) — здесь.
 */

import mongoose from 'mongoose';
import type {
  IncomeEntry,
  IncomeEntryCreate,
  IncomeEntryUpdate,
} from './types.js';
import IncomeEntryModel from './model.js';
import { AppError } from '../../lib/errors.js';

function docToIncomeEntry(doc: {
  _id: mongoose.Types.ObjectId;
  amount: number;
  date: string;
  source: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}): IncomeEntry {
  return {
    direction: 'income',
    id: String(doc._id),
    amount: doc.amount,
    date: doc.date,
    source: doc.source,
    ...(doc.note != null && doc.note !== '' && { note: doc.note }),
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

export const incomeEntriesService = {
  async list(userId: string): Promise<IncomeEntry[]> {
    const uid = toObjectId(userId);
    const docs = await IncomeEntryModel.find({ userId: uid })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    return docs.map(doc => docToIncomeEntry(doc));
  },

  async listByDateRange(
    userId: string,
    from: string,
    to: string
  ): Promise<IncomeEntry[]> {
    const uid = toObjectId(userId);
    const docs = await IncomeEntryModel.find({
      userId: uid,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    return docs.map(doc => docToIncomeEntry(doc));
  },

  async getById(userId: string, id: string): Promise<IncomeEntry> {
    const uid = toObjectId(userId);
    const doc = await IncomeEntryModel.findOne({
      _id: toObjectId(id),
      userId: uid,
    }).lean();
    if (!doc) {
      throw new AppError('Income entry not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToIncomeEntry(doc);
  },

  async create(
    userId: string,
    data: IncomeEntryCreate
  ): Promise<IncomeEntry> {
    const uid = toObjectId(userId);
    const doc = await IncomeEntryModel.create({
      userId: uid,
      amount: data.amount,
      date: data.date.trim(),
      source: data.source.trim(),
      ...(data.note != null && data.note !== '' && { note: data.note.trim() }),
    });
    return docToIncomeEntry(doc);
  },

  async update(
    userId: string,
    id: string,
    data: IncomeEntryUpdate
  ): Promise<IncomeEntry> {
    const uid = toObjectId(userId);
    const update: Record<string, unknown> = {};
    if (data.amount !== undefined) update.amount = data.amount;
    if (data.date !== undefined) update.date = data.date.trim();
    if (data.source !== undefined) update.source = data.source.trim();
    if (data.note !== undefined) update.note = data.note?.trim() ?? null;

    const doc = await IncomeEntryModel.findOneAndUpdate(
      { _id: toObjectId(id), userId: uid },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) {
      throw new AppError('Income entry not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToIncomeEntry(doc);
  },

  async delete(userId: string, id: string): Promise<void> {
    const uid = toObjectId(userId);
    const result = await IncomeEntryModel.findOneAndDelete({
      _id: toObjectId(id),
      userId: uid,
    });
    if (!result) {
      throw new AppError('Income entry not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
  },
};
