/**
 * Доменный сервис групп платежей.
 * Вся работа с БД и правила владения (userId) — здесь.
 */

import mongoose from 'mongoose';
import type {
  PaymentGroup,
  PaymentGroupCreate,
  PaymentGroupUpdate,
} from './types.js';
import PaymentGroupModel from './model.js';
import { AppError } from '../../lib/errors.js';

function docToPaymentGroup(doc: {
  _id: mongoose.Types.ObjectId;
  name: string;
  sortOrder: number;
  color?: string;
  icon?: string;
  archived?: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PaymentGroup {
  return {
    id: String(doc._id),
    name: doc.name,
    sortOrder: doc.sortOrder,
    ...(doc.color != null && { color: doc.color }),
    ...(doc.icon != null && { icon: doc.icon }),
    ...(doc.archived === true && { archived: true }),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid id', { statusCode: 400, code: 'INVALID_ID' });
  }
  return new mongoose.Types.ObjectId(id);
}

export const paymentGroupsService = {
  async list(userId: string): Promise<PaymentGroup[]> {
    const uid = toObjectId(userId);
    const docs = await PaymentGroupModel.find({
      userId: uid,
      archived: { $ne: true },
    })
      .sort({ sortOrder: 1 })
      .lean();
    return docs.map(doc => docToPaymentGroup(doc));
  },

  async listArchived(userId: string): Promise<PaymentGroup[]> {
    const uid = toObjectId(userId);
    const docs = await PaymentGroupModel.find({
      userId: uid,
      archived: true,
    })
      .sort({ sortOrder: 1 })
      .lean();
    return docs.map(doc => docToPaymentGroup(doc));
  },

  async getById(userId: string, id: string): Promise<PaymentGroup> {
    const uid = toObjectId(userId);
    const doc = await PaymentGroupModel.findOne({
      _id: toObjectId(id),
      userId: uid,
    }).lean();
    if (!doc) {
      throw new AppError('Group not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToPaymentGroup(doc);
  },

  async create(
    userId: string,
    data: PaymentGroupCreate
  ): Promise<PaymentGroup> {
    const uid = toObjectId(userId);
    const doc = await PaymentGroupModel.create({
      userId: uid,
      name: data.name.trim(),
      sortOrder: data.sortOrder,
      ...(data.color != null &&
        data.color !== '' && { color: data.color.trim() }),
      ...(data.icon != null && data.icon !== '' && { icon: data.icon.trim() }),
    });
    return docToPaymentGroup(doc);
  },

  async update(
    userId: string,
    id: string,
    data: PaymentGroupUpdate
  ): Promise<PaymentGroup> {
    const uid = toObjectId(userId);
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name.trim();
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
    if (data.color !== undefined) update.color = data.color?.trim() ?? null;
    if (data.icon !== undefined) update.icon = data.icon?.trim() ?? null;

    const doc = await PaymentGroupModel.findOneAndUpdate(
      { _id: toObjectId(id), userId: uid },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) {
      throw new AppError('Group not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    return docToPaymentGroup(doc);
  },

  async delete(userId: string, id: string): Promise<void> {
    const uid = toObjectId(userId);
    const result = await PaymentGroupModel.findOneAndUpdate(
      { _id: toObjectId(id), userId: uid },
      { $set: { archived: true } }
    );
    if (!result) {
      throw new AppError('Group not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
  },
};
