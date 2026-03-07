/**
 * Домен: расходы (платежи).
 */

export * from './types';
export {
  fetchInstantExpenses,
  fetchInstantExpense,
  createInstantExpense,
  updateInstantExpense,
  deleteInstantExpense,
  isInstantExpensePayment,
  isInstantExpensePaymentArray,
  fetchRecurringExpenses,
  fetchRecurringExpense,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  isRecurringExpensePayment,
  isRecurringExpensePaymentArray,
} from './api';
