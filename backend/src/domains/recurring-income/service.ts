/**
 * Доменный сервис повторяющихся доходов.
 */

import mongoose from 'mongoose';
import type {
  RecurringIncome,
  RecurringIncomeCreate,
  RecurringIncomeUpdate,
} from 'shared/recurring-income';
import RecurringIncomeModel from './model.js';
import type { RecurrenceDoc } from './model.js';
import { AppError } from '../../lib/errors.js';

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid id', { statusCode: 400, code: 'INVALID_ID' });
  }
  return new mongoose.Types.ObjectId(id);
}

function docToRecurringIncome(doc: {
  _id: mongoose.Types.ObjectId;
  source: string;
  amountPerOccurrence: number;
  recurrence: RecurrenceDoc;
  repeatCount: number | null;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}): RecurringIncome {
  return {
    id: String(doc._id),
    source: doc.source,
    amountPerOccurrence: doc.amountPerOccurrence,
    recurrence: doc.recurrence as RecurringIncome['recurrence'],
    repeatCount: doc.repeatCount,
    ...(doc.note != null && doc.note !== '' && { note: doc.note }),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const recurringIncomeService = {
  async list(userId: string): Promise<RecurringIncome[]> {
    const uid = toObjectId(userId);
    const docs = await RecurringIncomeModel.find({ userId: uid })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(doc => docToRecurringIncome(doc));
  },

  async getById(userId: string, id: string): Promise<RecurringIncome> {
    const uid = toObjectId(userId);
    const doc = await RecurringIncomeModel.findOne({
      _id: toObjectId(id),
      userId: uid,
    }).lean();
    if (!doc) {
      throw new AppError('Recurring income not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToRecurringIncome(doc);
  },

  async create(
    userId: string,
    data: RecurringIncomeCreate
  ): Promise<RecurringIncome> {
    const uid = toObjectId(userId);
    const doc = await RecurringIncomeModel.create({
      userId: uid,
      source: data.source.trim(),
      ...(data.note != null && data.note !== '' && { note: data.note.trim() }),
      amountPerOccurrence: data.amountPerOccurrence,
      recurrence: data.recurrence,
      repeatCount: data.repeatCount ?? null,
    });
    return docToRecurringIncome(doc);
  },

  async update(
    userId: string,
    id: string,
    data: RecurringIncomeUpdate
  ): Promise<RecurringIncome> {
    const uid = toObjectId(userId);
    const update: Record<string, unknown> = {};
    if (data.source !== undefined) update.source = data.source.trim();
    if (data.note !== undefined) update.note = data.note?.trim() ?? null;
    if (data.amountPerOccurrence !== undefined)
      update.amountPerOccurrence = data.amountPerOccurrence;
    if (data.recurrence !== undefined) update.recurrence = data.recurrence;
    if (data.repeatCount !== undefined) update.repeatCount = data.repeatCount;

    const doc = await RecurringIncomeModel.findOneAndUpdate(
      { _id: toObjectId(id), userId: uid },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) {
      throw new AppError('Recurring income not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToRecurringIncome(doc);
  },

  async delete(userId: string, id: string): Promise<void> {
    const uid = toObjectId(userId);
    const result = await RecurringIncomeModel.findOneAndDelete({
      _id: toObjectId(id),
      userId: uid,
    });
    if (!result) {
      throw new AppError('Recurring income not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
  },
};
