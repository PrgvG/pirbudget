/**
 * Домен: группы платежей (категории расходов).
 */

export * from './types';
export {
  fetchPaymentGroups,
  fetchArchivedPaymentGroups,
  fetchPaymentGroup,
  createPaymentGroup,
  updatePaymentGroup,
  deletePaymentGroup,
  isPaymentGroup,
  isPaymentGroupArray,
} from './api';
