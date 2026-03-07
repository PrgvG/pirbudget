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

function toIsoDateTime(dateStr: string): string {
  if (!dateStr || dateStr.length > 10) return dateStr;
  return `${dateStr}T00:00:00.000Z`;
}

function entryToTransaction(entry: Entry): Transaction {
  if (entry.direction === 'income') {
    return entry;
  }
  return {
    kind: 'instant',
    direction: 'expense',
    id: entry.id,
    groupId: entry.groupId,
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
  return a.kind === 'recurring' && b.kind === 'instant' ? -1 : a.kind === 'instant' && b.kind === 'recurring' ? 1 : 0;
}

export const transactionsService = {
  async getHistory(params: GetHistoryParams): Promise<Transaction[]> {
    const { userId, from, to, type = 'all', groupId } = params;
    const entries = await entriesService.listByDateRange({
      userId,
      from,
      to,
      type,
      groupId,
    });
    const all = entries.map(entryToTransaction);
    all.sort(byDateThenCreated);
    return all;
  },

  async getPlan(userId: string, from: string, to: string): Promise<PlannedItem[]> {
    const [recurringList, entriesList] = await Promise.all([
      recurringExpensesService.list(userId),
      entriesService.listByDateRange({ userId, from, to }),
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

    for (const entry of entriesList) {
      if (entry.direction === 'expense') {
        items.push({
          kind: 'instant',
          paymentId: entry.id,
          groupId: entry.groupId,
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
    const entries = await entriesService.listByDateRange({ userId, from, to });

    let totalIncome = 0;
    const groupSums = new Map<string, number>();
    let totalExpense = 0;

    for (const e of entries) {
      if (e.direction === 'income') {
        totalIncome += e.amount;
      } else {
        totalExpense += e.amount;
        const gid = e.groupId;
        groupSums.set(gid, (groupSums.get(gid) ?? 0) + e.amount);
      }
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
