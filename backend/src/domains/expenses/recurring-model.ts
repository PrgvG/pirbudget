/**
 * Модель Mongoose для повторяющихся расходов (платежей).
 * Все документы привязаны к userId.
 * recurrence — вложенный объект: interval (unit, interval, anchorDate, endDate?) или date (date).
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

type RecurrenceInterval = {
  kind: 'interval';
  unit: 'day' | 'week' | 'month' | 'year';
  interval: number;
  anchorDate: string;
  endDate?: string;
};

type RecurrenceDate = {
  kind: 'date';
  date: string;
};

export type RecurrenceDoc = RecurrenceInterval | RecurrenceDate;

export type IRecurringExpensePaymentDoc = Document & {
  userId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  note?: string;
  amountPerOccurrence: number;
  recurrence: RecurrenceDoc;
  repeatCount: number | null;
  createdAt: Date;
  updatedAt: Date;
};

const RecurrenceSchema = new Schema<RecurrenceDoc>(
  {
    kind: { type: String, required: true, enum: ['interval', 'date'] },
    unit: { type: String, enum: ['day', 'week', 'month', 'year'] },
    interval: { type: Number },
    anchorDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    date: { type: String, trim: true },
  },
  { _id: false }
);

const RecurringExpensePaymentSchema = new Schema<IRecurringExpensePaymentDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentGroup',
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
    },
    amountPerOccurrence: {
      type: Number,
      required: true,
    },
    recurrence: {
      type: RecurrenceSchema,
      required: true,
    },
    repeatCount: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'recurring_expense_payments',
  }
);

const RecurringExpensePayment: Model<IRecurringExpensePaymentDoc> =
  mongoose.models.RecurringExpensePayment ||
  mongoose.model<IRecurringExpensePaymentDoc>(
    'RecurringExpensePayment',
    RecurringExpensePaymentSchema
  );

export default RecurringExpensePayment;
