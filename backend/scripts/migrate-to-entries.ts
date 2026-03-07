/**
 * Одноразовая миграция: копирование данных из income_entries и
 * instant_expense_payments в коллекцию entries.
 *
 * Запуск из корня backend: npx tsx scripts/migrate-to-entries.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/lib/mongoose.js';
import EntryModel from '../src/domains/entries/model.js';

type IncomeDoc = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  date: string;
  source: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

type InstantExpenseDoc = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  amount: number;
  date: string;
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

  const incomeColl = db.collection<IncomeDoc>('income_entries');
  const instantColl = db.collection<InstantExpenseDoc>('instant_expense_payments');

  const incomes = await incomeColl.find({}).toArray();
  const instants = await instantColl.find({}).toArray();

  const entryDocs: Array<{
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    direction: 'income' | 'expense';
    amount: number;
    date: string;
    note?: string;
    source?: string;
    groupId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const d of incomes) {
    entryDocs.push({
      _id: d._id,
      userId: d.userId,
      direction: 'income',
      amount: d.amount,
      date: d.date.length === 10 ? d.date : d.date.slice(0, 10),
      ...(d.note != null && d.note !== '' && { note: d.note }),
      source: d.source,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    });
  }

  for (const d of instants) {
    entryDocs.push({
      _id: d._id,
      userId: d.userId,
      direction: 'expense',
      amount: d.amount,
      date: d.date.length === 10 ? d.date : d.date.slice(0, 10),
      ...(d.note != null && d.note !== '' && { note: d.note }),
      groupId: d.groupId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    });
  }

  if (entryDocs.length === 0) {
    console.log('Нет данных для миграции.');
    await disconnectDB();
    return;
  }

  await EntryModel.insertMany(entryDocs);
  console.log(
    `Мигрировано: ${incomes.length} поступлений, ${instants.length} разовых расходов → ${entryDocs.length} записей в entries.`
  );

  await disconnectDB();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
