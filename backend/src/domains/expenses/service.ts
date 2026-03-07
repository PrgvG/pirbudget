/**
 * Доменный сервис расходов (разовые и повторяющиеся платежи).
 * Вся работа с БД и правила владения (userId) — здесь.
 */

import mongoose from 'mongoose';
import type {
  InstantExpensePayment,
  RecurringExpensePayment,
  InstantExpensePaymentCreate,
  InstantExpensePaymentUpdate,
  RecurringExpensePaymentCreate,
  RecurringExpensePaymentUpdate,
} from './types.js';
import InstantExpensePaymentModel from './instant-model.js';
import RecurringExpensePaymentModel from './recurring-model.js';
import type { RecurrenceDoc } from './recurring-model.js';
import { AppError } from '../../lib/errors.js';

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid id', { statusCode: 400, code: 'INVALID_ID' });
  }
  return new mongoose.Types.ObjectId(id);
}

/** Нормализует дату из БД в ISO datetime для ответа API */
function toIsoDateTime(dateStr: string): string {
  if (!dateStr || dateStr.length > 10) return dateStr;
  return `${dateStr}T00:00:00.000Z`;
}

/** Извлекает YYYY-MM-DD из ISO datetime или оставляет как есть */
function toDateOnly(dateStr: string): string {
  if (!dateStr) return dateStr;
  const idx = dateStr.indexOf('T');
  return idx >= 0 ? dateStr.slice(0, idx) : dateStr;
}

function docToInstant(doc: {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  note?: string;
  amount: number;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}): InstantExpensePayment {
  return {
    kind: 'instant',
    id: String(doc._id),
    groupId: String(doc.groupId),
    ...(doc.note != null && doc.note !== '' && { note: doc.note }),
    amount: doc.amount,
    date: toIsoDateTime(doc.date),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function docToRecurring(doc: {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  note?: string;
  amountPerOccurrence: number;
  recurrence: RecurrenceDoc;
  repeatCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}): RecurringExpensePayment {
  return {
    kind: 'recurring',
    id: String(doc._id),
    groupId: String(doc.groupId),
    ...(doc.note != null && doc.note !== '' && { note: doc.note }),
    amountPerOccurrence: doc.amountPerOccurrence,
    recurrence: doc.recurrence as RecurringExpensePayment['recurrence'],
    repeatCount: doc.repeatCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const instantExpensesService = {
  async list(userId: string): Promise<InstantExpensePayment[]> {
    const uid = toObjectId(userId);
    const docs = await InstantExpensePaymentModel.find({ userId: uid })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    return docs.map(doc => docToInstant(doc));
  },

  async getById(userId: string, id: string): Promise<InstantExpensePayment> {
    const uid = toObjectId(userId);
    const doc = await InstantExpensePaymentModel.findOne({
      _id: toObjectId(id),
      userId: uid,
    }).lean();
    if (!doc) {
      throw new AppError('Instant expense not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToInstant(doc);
  },

  async create(
    userId: string,
    data: InstantExpensePaymentCreate
  ): Promise<InstantExpensePayment> {
    const uid = toObjectId(userId);
    const groupId = toObjectId(data.groupId);
    const doc = await InstantExpensePaymentModel.create({
      userId: uid,
      groupId,
      ...(data.note != null && data.note !== '' && { note: data.note.trim() }),
      amount: data.amount,
      date: toDateOnly(data.date),
    });
    return docToInstant(doc);
  },

  async update(
    userId: string,
    id: string,
    data: InstantExpensePaymentUpdate
  ): Promise<InstantExpensePayment> {
    const uid = toObjectId(userId);
    const update: Record<string, unknown> = {};
    if (data.groupId !== undefined) update.groupId = toObjectId(data.groupId);
    if (data.note !== undefined) update.note = data.note?.trim() ?? null;
    if (data.amount !== undefined) update.amount = data.amount;
    if (data.date !== undefined) update.date = toDateOnly(data.date);

    const doc = await InstantExpensePaymentModel.findOneAndUpdate(
      { _id: toObjectId(id), userId: uid },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) {
      throw new AppError('Instant expense not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToInstant(doc);
  },

  async delete(userId: string, id: string): Promise<void> {
    const uid = toObjectId(userId);
    const result = await InstantExpensePaymentModel.findOneAndDelete({
      _id: toObjectId(id),
      userId: uid,
    });
    if (!result) {
      throw new AppError('Instant expense not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
  },
};

export const recurringExpensesService = {
  async list(userId: string): Promise<RecurringExpensePayment[]> {
    const uid = toObjectId(userId);
    const docs = await RecurringExpensePaymentModel.find({ userId: uid })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(doc => docToRecurring(doc));
  },

  async getById(
    userId: string,
    id: string
  ): Promise<RecurringExpensePayment> {
    const uid = toObjectId(userId);
    const doc = await RecurringExpensePaymentModel.findOne({
      _id: toObjectId(id),
      userId: uid,
    }).lean();
    if (!doc) {
      throw new AppError('Recurring expense not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToRecurring(doc);
  },

  async create(
    userId: string,
    data: RecurringExpensePaymentCreate
  ): Promise<RecurringExpensePayment> {
    const uid = toObjectId(userId);
    const groupId = toObjectId(data.groupId);
    const doc = await RecurringExpensePaymentModel.create({
      userId: uid,
      groupId,
      ...(data.note != null && data.note !== '' && { note: data.note.trim() }),
      amountPerOccurrence: data.amountPerOccurrence,
      recurrence: data.recurrence,
      repeatCount: data.repeatCount ?? null,
    });
    return docToRecurring(doc);
  },

  async update(
    userId: string,
    id: string,
    data: RecurringExpensePaymentUpdate
  ): Promise<RecurringExpensePayment> {
    const uid = toObjectId(userId);
    const update: Record<string, unknown> = {};
    if (data.groupId !== undefined) update.groupId = toObjectId(data.groupId);
    if (data.note !== undefined) update.note = data.note?.trim() ?? null;
    if (data.amountPerOccurrence !== undefined)
      update.amountPerOccurrence = data.amountPerOccurrence;
    if (data.recurrence !== undefined) update.recurrence = data.recurrence;
    if (data.repeatCount !== undefined) update.repeatCount = data.repeatCount;

    const doc = await RecurringExpensePaymentModel.findOneAndUpdate(
      { _id: toObjectId(id), userId: uid },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) {
      throw new AppError('Recurring expense not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToRecurring(doc);
  },

  async delete(userId: string, id: string): Promise<void> {
    const uid = toObjectId(userId);
    const result = await RecurringExpensePaymentModel.findOneAndDelete({
      _id: toObjectId(id),
      userId: uid,
    });
    if (!result) {
      throw new AppError('Recurring expense not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
  },
};
