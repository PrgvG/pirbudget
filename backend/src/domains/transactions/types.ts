/**
 * Домен: операции (доходы и расходы).
 * Единая сущность Transaction с различателем direction.
 */

export type {
  IncomeEntry,
  ExpenseEntry,
  Transaction,
  IncomeEntryCreate,
  IncomeEntryUpdate,
} from 'shared/transactions';

/** Агрегация за месяц: доходы, расходы, баланс, разбивка по группам. */
export type MonthStats = {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByGroup: { groupId: string; sum: number }[];
};
