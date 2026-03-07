/**
 * Одноразовая миграция: создание справочника категорий из payment_groups и source,
 * замена groupId/source на categoryId в entries, recurring_income, recurring_expense_payments.
 *
 * Запуск из корня backend: npx tsx scripts/migrate-to-categories.ts
 *
 * Требует: коллекции entries (с полями source/groupId), payment_groups,
 * recurring_income (source), recurring_expense_payments (groupId).
 * После миграции в документах остаётся только categoryId.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/lib/mongoose.js';
// Загружаем модель Category, чтобы коллекция categories была создана
import CategoryModel from '../src/domains/categories/model.js';

type PaymentGroupDoc = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  sortOrder: number;
  color?: string;
  icon?: string;
  archived?: boolean;
};

type EntryDoc = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  direction: 'income' | 'expense';
  amount: number;
  date: string;
  note?: string;
  source?: string;
  groupId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
};

type RecurringIncomeDoc = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  source?: string;
  categoryId?: mongoose.Types.ObjectId;
  amountPerOccurrence: number;
  recurrence: unknown;
  repeatCount: number | null;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

type RecurringExpenseDoc = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  amountPerOccurrence: number;
  recurrence: unknown;
  repeatCount: number | null;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

async function migrate(): Promise<void> {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('No database connection');
  }

  const paymentGroupsColl = db.collection<PaymentGroupDoc>('payment_groups');
  const entriesColl = db.collection<EntryDoc>('entries');
  const recurringIncomeColl = db.collection<RecurringIncomeDoc>('recurring_income');
  const recurringExpenseColl = db.collection<RecurringExpenseDoc>('recurring_expense_payments');

  const groupIdToCategoryId = new Map<string, mongoose.Types.ObjectId>();
  const incomeSourceKeyToCategoryId = new Map<string, mongoose.Types.ObjectId>();

  // 1) Создать категории из payment_groups (direction=expense)
  const groups = await paymentGroupsColl.find({}).toArray();
  for (const g of groups) {
    const doc = await CategoryModel.create({
      userId: g.userId,
      name: g.name,
      sortOrder: g.sortOrder,
      ...(g.color != null && g.color !== '' && { color: g.color }),
      ...(g.icon != null && g.icon !== '' && { icon: g.icon }),
      ...(g.archived === true && { archived: true }),
      direction: 'expense',
    });
    groupIdToCategoryId.set(String(g._id), doc._id as mongoose.Types.ObjectId);
  }
  console.log(`Создано категорий расходов: ${groups.length}`);

  // 2) Обновить entries (expense): groupId -> categoryId, убрать source/groupId
  const expenseEntries = await entriesColl
    .find({ direction: 'expense', groupId: { $exists: true, $ne: null } })
    .toArray();
  for (const e of expenseEntries) {
    if (e.categoryId) continue; // уже мигрировано
    const oldGroupId = e.groupId;
    if (!oldGroupId) continue;
    const categoryId = groupIdToCategoryId.get(String(oldGroupId));
    if (!categoryId) {
      console.warn(`Entry ${e._id}: groupId ${oldGroupId} не найден в маппинге`);
      continue;
    }
    await entriesColl.updateOne(
      { _id: e._id },
      { $set: { categoryId }, $unset: { source: '', groupId: '' } as Record<string, 1> }
    );
  }
  console.log(`Обновлено записей (расход): ${expenseEntries.length}`);

  // 3) Собрать уникальные (userId, source) для доходов из entries и recurring_income
  const incomeEntries = await entriesColl
    .find({ direction: 'income', $or: [{ source: { $exists: true } }, { categoryId: { $exists: false } }] })
    .toArray();
  const recurringIncomes = await recurringIncomeColl.find({}).toArray();
  const incomeSources = new Map<string, { userId: mongoose.Types.ObjectId; name: string }>();
  for (const e of incomeEntries) {
    const src = (e.source ?? '').trim();
    if (src === '' || e.categoryId) continue;
    const key = `${e.userId}:${src}`;
    if (!incomeSources.has(key)) {
      incomeSources.set(key, { userId: e.userId, name: src });
    }
  }
  for (const r of recurringIncomes) {
    const src = (r.source ?? '').trim();
    if (src === '') continue;
    const key = `${r.userId}:${src}`;
    if (!incomeSources.has(key)) {
      incomeSources.set(key, { userId: r.userId, name: src });
    }
  }

  let sortOrder = 0;
  for (const [, { userId, name }] of incomeSources) {
    const doc = await CategoryModel.create({
      userId,
      name,
      sortOrder: sortOrder++,
      direction: 'income',
    });
    incomeSourceKeyToCategoryId.set(`${userId}:${name}`, doc._id as mongoose.Types.ObjectId);
  }
  console.log(`Создано категорий доходов: ${incomeSources.size}`);

  // 4) Обновить entries (income): source -> categoryId, убрать source
  for (const e of incomeEntries) {
    if (e.categoryId) continue;
    const src = (e.source ?? '').trim();
    const key = `${e.userId}:${src}`;
    const categoryId = incomeSourceKeyToCategoryId.get(key);
    if (!categoryId) {
      if (src === '') {
        console.warn(`Entry ${e._id} (income) без source — пропуск (нужно вручную задать категорию)`);
      } else {
        console.warn(`Entry ${e._id}: source "${src}" не найден в маппинге`);
      }
      continue;
    }
    await entriesColl.updateOne(
      { _id: e._id },
      { $set: { categoryId }, $unset: { source: '', groupId: '' } as Record<string, 1> }
    );
  }
  console.log(`Обновлено записей (доход): ${incomeEntries.length}`);

  // 5) Обновить recurring_income: source -> categoryId
  for (const r of recurringIncomes) {
    if (r.categoryId) continue;
    const src = (r.source ?? '').trim();
    const key = `${r.userId}:${src}`;
    const categoryId = incomeSourceKeyToCategoryId.get(key);
    if (!categoryId) {
      console.warn(`RecurringIncome ${r._id}: source "${src}" не найден`);
      continue;
    }
    await recurringIncomeColl.updateOne(
      { _id: r._id },
      { $set: { categoryId }, $unset: { source: '' } }
    );
  }
  console.log(`Обновлено повторяющихся доходов: ${recurringIncomes.length}`);

  // 6) Обновить recurring_expense_payments: groupId -> categoryId
  const recurringExpenses = await recurringExpenseColl.find({}).toArray();
  for (const r of recurringExpenses) {
    if (r.categoryId) continue;
    const oldGroupId = r.groupId;
    if (!oldGroupId) {
      console.warn(`RecurringExpense ${r._id} без groupId — пропуск`);
      continue;
    }
    const categoryId = groupIdToCategoryId.get(String(oldGroupId));
    if (!categoryId) {
      console.warn(`RecurringExpense ${r._id}: groupId ${oldGroupId} не найден`);
      continue;
    }
    await recurringExpenseColl.updateOne(
      { _id: r._id },
      { $set: { categoryId }, $unset: { groupId: '' } }
    );
  }
  console.log(`Обновлено повторяющихся расходов: ${recurringExpenses.length}`);

  console.log('Миграция завершена.');
  await disconnectDB();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
