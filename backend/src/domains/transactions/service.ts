/**
 * Сервис операций (история и план: доходы, разовые и повторяющиеся расходы за период).
 */

import type { Transaction } from 'shared/transactions';
import type { Entry } from 'shared/entries';
import type { PlannedItem } from 'shared';
import { expandRecurrence } from 'shared';
import type { MonthStats } from './types.js';
import { entriesService } from '../entries/service.js';
import { recurringExpensesService } from '../expenses/service.js';
import { recurringIncomeService } from '../recurring-income/service.js';

function getMonthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export type HistoryFilterType = 'income' | 'expense' | 'all';

export type GetHistoryParams = {
  userId: string;
  from: string;
  to: string;
  type?: HistoryFilterType;
  categoryId?: string;
};

function toIsoDateTime(dateStr: string): string {
  if (!dateStr || dateStr.length > 10) return dateStr;
  return `${dateStr}T00:00:00.000Z`;
}

function entryToTransaction(entry: Entry): Transaction {
  if (entry.direction === 'income') {
    return {
      direction: 'income',
      id: entry.id,
      amount: entry.amount,
      date: toIsoDateTime(entry.date),
      categoryId: entry.categoryId,
      ...(entry.note != null && entry.note !== '' && { note: entry.note }),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
  return {
    kind: 'instant',
    direction: 'expense',
    id: entry.id,
    categoryId: entry.categoryId,
    amount: entry.amount,
    date: toIsoDateTime(entry.date),
    ...(entry.note != null && entry.note !== '' && { note: entry.note }),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function byDateThenCreated(a: Transaction, b: Transaction): number {
  const dateA = 'date' in a ? (typeof a.date === 'string' ? a.date.slice(0, 10) : '') : '';
  const dateB = 'date' in b ? (typeof b.date === 'string' ? b.date.slice(0, 10) : '') : '';
  if (dateA !== dateB) return dateB.localeCompare(dateA);
  const createdA = 'createdAt' in a ? a.createdAt : '';
  const createdB = 'createdAt' in b ? b.createdAt : '';
  return createdB.localeCompare(createdA);
}

function byScheduledDateThenKind(a: PlannedItem, b: PlannedItem): number {
  if (a.scheduledDate !== b.scheduledDate) {
    return a.scheduledDate.localeCompare(b.scheduledDate);
  }
  const order: Record<PlannedItem['kind'], number> = {
    recurring: 0,
    recurringIncome: 0,
    instant: 1,
  };
  return order[a.kind] - order[b.kind];
}

export const transactionsService = {
  async getHistory(params: GetHistoryParams): Promise<Transaction[]> {
    const { userId, from, to, type = 'all', categoryId } = params;
    const entries = await entriesService.listByDateRange({
      userId,
      from,
      to,
      type,
      categoryId,
    });
    const all = entries.map(entryToTransaction);
    all.sort(byDateThenCreated);
    return all;
  },

  async getPlan(userId: string, from: string, to: string): Promise<PlannedItem[]> {
    const [recurringExpenseList, recurringIncomeList, entriesList] =
      await Promise.all([
        recurringExpensesService.list(userId),
        recurringIncomeService.list(userId),
        entriesService.listByDateRange({ userId, from, to }),
      ]);

    const items: PlannedItem[] = [];

    for (const rec of recurringExpenseList) {
      const dates = expandRecurrence(
        rec.recurrence,
        from,
        to,
        rec.repeatCount ?? null
      );
      for (const scheduledDate of dates) {
        items.push({
          kind: 'recurring',
          paymentId: rec.id,
          categoryId: rec.categoryId,
          scheduledDate,
          amount: rec.amountPerOccurrence,
          ...(rec.note != null && rec.note !== '' && { note: rec.note }),
        });
      }
    }

    for (const rec of recurringIncomeList) {
      const dates = expandRecurrence(
        rec.recurrence,
        from,
        to,
        rec.repeatCount ?? null
      );
      for (const scheduledDate of dates) {
        items.push({
          kind: 'recurringIncome',
          paymentId: rec.id,
          categoryId: rec.categoryId,
          scheduledDate,
          amount: rec.amountPerOccurrence,
          ...(rec.note != null && rec.note !== '' && { note: rec.note }),
        });
      }
    }

    for (const entry of entriesList) {
      if (entry.direction === 'expense') {
        items.push({
          kind: 'instant',
          paymentId: entry.id,
          categoryId: entry.categoryId,
          scheduledDate: entry.date,
          amount: entry.amount,
          ...(entry.note != null && entry.note !== '' && { note: entry.note }),
        });
      }
    }

    items.sort(byScheduledDateThenKind);
    return items;
  },

  async getMonthStats(userId: string, month: string): Promise<MonthStats> {
    const { from, to } = getMonthBounds(month);
    const [entries, recurringExpenseList, recurringIncomeList] = await Promise.all([
      entriesService.listByDateRange({ userId, from, to }),
      recurringExpensesService.list(userId),
      recurringIncomeService.list(userId),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByCat = new Map<string, number>();
    const expenseByCat = new Map<string, number>();

    for (const e of entries) {
      if (e.direction === 'income') {
        totalIncome += e.amount;
        incomeByCat.set(e.categoryId, (incomeByCat.get(e.categoryId) ?? 0) + e.amount);
      } else {
        totalExpense += e.amount;
        expenseByCat.set(e.categoryId, (expenseByCat.get(e.categoryId) ?? 0) + e.amount);
      }
    }

    for (const rec of recurringIncomeList) {
      const dates = expandRecurrence(
        rec.recurrence,
        from,
        to,
        rec.repeatCount ?? null
      );
      const sum = rec.amountPerOccurrence * dates.length;
      if (sum > 0) {
        totalIncome += sum;
        incomeByCat.set(
          rec.categoryId,
          (incomeByCat.get(rec.categoryId) ?? 0) + sum
        );
      }
    }

    for (const rec of recurringExpenseList) {
      const dates = expandRecurrence(
        rec.recurrence,
        from,
        to,
        rec.repeatCount ?? null
      );
      const sum = rec.amountPerOccurrence * dates.length;
      if (sum > 0) {
        totalExpense += sum;
        expenseByCat.set(
          rec.categoryId,
          (expenseByCat.get(rec.categoryId) ?? 0) + sum
        );
      }
    }

    const incomeByCategory = Array.from(incomeByCat.entries()).map(
      ([categoryId, sum]) => ({ categoryId, sum })
    );
    const expensesByCategory = Array.from(expenseByCat.entries()).map(
      ([categoryId, sum]) => ({ categoryId, sum })
    );

    return {
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeByCategory,
      expensesByCategory,
    };
  },
};
