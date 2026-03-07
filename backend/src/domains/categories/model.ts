/**
 * Модель Mongoose для категорий (доходы и расходы).
 * Все документы привязаны к userId.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type ICategoryDoc = Document & {
  userId: mongoose.Types.ObjectId;
  name: string;
  sortOrder: number;
  color?: string;
  icon?: string;
  archived?: boolean;
  direction: 'income' | 'expense';
  createdAt: Date;
  updatedAt: Date;
};

const CategorySchema = new Schema<ICategoryDoc>(
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
    direction: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'categories',
  }
);

CategorySchema.index({ userId: 1, direction: 1, sortOrder: 1 });

const Category: Model<ICategoryDoc> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDoc>('Category', CategorySchema);

export default Category;
