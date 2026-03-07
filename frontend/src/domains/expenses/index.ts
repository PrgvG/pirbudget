/**
 * Домен: повторяющиеся расходы. Разовые — в домене entries.
 */

export * from './types';
export {
  fetchRecurringExpenses,
  fetchRecurringExpense,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  isRecurringExpensePayment,
  isRecurringExpensePaymentArray,
} from './api';
