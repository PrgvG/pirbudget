/**
 * Сервис операций (история и план: доходы, разовые и повторяющиеся расходы за период).
 */

import type { Transaction, IncomeEntry } from 'shared/transactions';
import type { PlannedItem } from 'shared';
import { expandRecurrence } from 'shared';
import type { InstantExpensePayment } from '../expenses/types.js';
import type { MonthStats } from './types.js';
import { incomeEntriesService } from '../income-entries/service.js';
import {
  instantExpensesService,
  recurringExpensesService,
} from '../expenses/service.js';

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
  groupId?: string;
};

function instantToExpenseEntry(instant: InstantExpensePayment): Transaction {
  return {
    ...instant,
    direction: 'expense',
  };
}

function byDateThenCreated(a: Transaction, b: Transaction): number {
  const dateA = 'date' in a ? a.date : '';
  const dateB = 'date' in b ? b.date : '';
  if (dateA !== dateB) return dateB.localeCompare(dateA);
  const createdA = 'createdAt' in a ? a.createdAt : '';
  const createdB = 'createdAt' in b ? b.createdAt : '';
  return createdB.localeCompare(createdA);
}

function byScheduledDateThenKind(a: PlannedItem, b: PlannedItem): number {
  if (a.scheduledDate !== b.scheduledDate) {
    return a.scheduledDate.localeCompare(b.scheduledDate);
  }
  return a.kind === 'recurring' && b.kind === 'instant' ? -1 : a.kind === 'instant' && b.kind === 'recurring' ? 1 : 0;
}

export const transactionsService = {
  async getHistory(params: GetHistoryParams): Promise<Transaction[]> {
    const { userId, from, to, type = 'all', groupId } = params;

    const [incomes, instantExpenses] = await Promise.all([
      type === 'expense'
        ? Promise.resolve([] as IncomeEntry[])
        : incomeEntriesService.listByDateRange(userId, from, to),
      type === 'income'
        ? Promise.resolve([] as InstantExpensePayment[])
        : instantExpensesService.listByDateRange(userId, from, to, groupId),
    ]);

    const expenseEntries: Transaction[] = instantExpenses.map(instantToExpenseEntry);
    const all: Transaction[] = [...incomes, ...expenseEntries];
    all.sort(byDateThenCreated);
    return all;
  },

  async getPlan(userId: string, from: string, to: string): Promise<PlannedItem[]> {
    const [recurringList, instantList] = await Promise.all([
      recurringExpensesService.list(userId),
      instantExpensesService.listByDateRange(userId, from, to),
    ]);

    const items: PlannedItem[] = [];

    for (const rec of recurringList) {
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
          groupId: rec.groupId,
          scheduledDate,
          amount: rec.amountPerOccurrence,
          ...(rec.note != null && rec.note !== '' && { note: rec.note }),
        });
      }
    }

    for (const inst of instantList) {
      const scheduledDate = inst.date.slice(0, 10);
      items.push({
        kind: 'instant',
        paymentId: inst.id,
        groupId: inst.groupId,
        scheduledDate,
        amount: inst.amount,
        ...(inst.note != null && inst.note !== '' && { note: inst.note }),
      });
    }

    items.sort(byScheduledDateThenKind);
    return items;
  },

  async getMonthStats(userId: string, month: string): Promise<MonthStats> {
    const { from, to } = getMonthBounds(month);

    const [incomes, instantExpenses] = await Promise.all([
      incomeEntriesService.listByDateRange(userId, from, to),
      instantExpensesService.listByDateRange(userId, from, to),
    ]);

    const totalIncome = incomes.reduce((acc, e) => acc + e.amount, 0);

    const groupSums = new Map<string, number>();
    let totalExpense = 0;
    for (const e of instantExpenses) {
      totalExpense += e.amount;
      const gid = e.groupId;
      groupSums.set(gid, (groupSums.get(gid) ?? 0) + e.amount);
    }

    const expensesByGroup = Array.from(groupSums.entries()).map(
      ([groupId, sum]) => ({ groupId, sum })
    );

    return {
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      expensesByGroup,
    };
  },
};
