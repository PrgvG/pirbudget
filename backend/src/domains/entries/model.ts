/**
 * Модель Mongoose для записей (доходы и разовые расходы).
 * Все документы привязаны к userId.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type IEntryDoc = Document & {
  userId: mongoose.Types.ObjectId;
  direction: 'income' | 'expense';
  amount: number;
  /** ISO date string YYYY-MM-DD */
  date: string;
  note?: string;
  categoryId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const EntrySchema = new Schema<IEntryDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['income', 'expense'],
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
    note: {
      type: String,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'entries',
  }
);

EntrySchema.index({ userId: 1, date: -1 });

const Entry: Model<IEntryDoc> =
  mongoose.models.Entry || mongoose.model<IEntryDoc>('Entry', EntrySchema);

export default Entry;
