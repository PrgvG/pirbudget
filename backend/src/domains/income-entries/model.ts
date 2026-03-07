/**
 * Модель Mongoose для поступлений (доходов).
 * Все документы привязаны к userId.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type IIncomeEntryDoc = Document & {
  userId: mongoose.Types.ObjectId;
  amount: number;
  /** ISO date string */
  date: string;
  source: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

const IncomeEntrySchema = new Schema<IIncomeEntryDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'income_entries',
  }
);

const IncomeEntry: Model<IIncomeEntryDoc> =
  mongoose.models.IncomeEntry ||
  mongoose.model<IIncomeEntryDoc>('IncomeEntry', IncomeEntrySchema);

export default IncomeEntry;
