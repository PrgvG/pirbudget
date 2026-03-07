/**
 * Домен: операции (доходы и расходы). История и план за период.
 */

export * from './types';
export {
  fetchHistory,
  isTransactionArray,
  type HistoryParams,
  fetchPlan,
  isPlannedItemArray,
  type PlanParams,
  fetchMonthStats,
} from './api';
export type { MonthStats } from './types';
