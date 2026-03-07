/**
 * Доменный сервис повторяющихся расходов.
 * Разовые расходы перенесены в домен entries.
 */

import mongoose from 'mongoose';
import type {
  RecurringExpensePayment,
  RecurringExpensePaymentCreate,
  RecurringExpensePaymentUpdate,
} from './types.js';
import RecurringExpensePaymentModel from './recurring-model.js';
import type { RecurrenceDoc } from './recurring-model.js';
import { AppError } from '../../lib/errors.js';

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid id', { statusCode: 400, code: 'INVALID_ID' });
  }
  return new mongoose.Types.ObjectId(id);
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
