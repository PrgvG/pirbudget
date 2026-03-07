/**
 * Модель Mongoose для групп платежей (категорий).
 * Все документы привязаны к userId.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type IPaymentGroupDoc = Document & {
  userId: mongoose.Types.ObjectId;
  name: string;
  sortOrder: number;
  color?: string;
  icon?: string;
  archived?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const PaymentGroupSchema = new Schema<IPaymentGroupDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'payment_groups',
  }
);

const PaymentGroup: Model<IPaymentGroupDoc> =
  mongoose.models.PaymentGroup ||
  mongoose.model<IPaymentGroupDoc>('PaymentGroup', PaymentGroupSchema);

export default PaymentGroup;
