/**
 * Модель Mongoose для повторяющихся доходов.
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

export type IRecurringIncomeDoc = Document & {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  amountPerOccurrence: number;
  recurrence: RecurrenceDoc;
  repeatCount: number | null;
  note?: string;
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

const RecurringIncomeSchema = new Schema<IRecurringIncomeDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
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
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'recurring_income',
  }
);

const RecurringIncome: Model<IRecurringIncomeDoc> =
  mongoose.models.RecurringIncome ||
  mongoose.model<IRecurringIncomeDoc>(
    'RecurringIncome',
    RecurringIncomeSchema
  );

export default RecurringIncome;
