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

/** Агрегация за месяц: доходы, расходы, баланс, разбивка по категориям. */
export type MonthStats = {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByCategory: { categoryId: string; sum: number }[];
  expensesByCategory: { categoryId: string; sum: number }[];
};
