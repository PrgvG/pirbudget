/**
 * Модель Mongoose для разовых расходов (платежей).
 * Все документы привязаны к userId.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type IInstantExpensePaymentDoc = Document & {
  userId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  note?: string;
  amount: number;
  /** ISO date string YYYY-MM-DD */
  date: string;
  createdAt: Date;
  updatedAt: Date;
};

const InstantExpensePaymentSchema = new Schema<IInstantExpensePaymentDoc>(
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
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'instant_expense_payments',
  }
);

const InstantExpensePayment: Model<IInstantExpensePaymentDoc> =
  mongoose.models.InstantExpensePayment ||
  mongoose.model<IInstantExpensePaymentDoc>(
    'InstantExpensePayment',
    InstantExpensePaymentSchema
  );

export default InstantExpensePayment;
