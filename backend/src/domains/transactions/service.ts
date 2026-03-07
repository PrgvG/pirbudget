/**
 * Сервис операций (история: доходы + разовые расходы за период).
 */

import type { Transaction, IncomeEntry } from 'shared/transactions';
import type { InstantExpensePayment } from '../expenses/types.js';
import { incomeEntriesService } from '../income-entries/service.js';
import { instantExpensesService } from '../expenses/service.js';

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
};
