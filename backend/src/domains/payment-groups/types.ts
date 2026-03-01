/**
 * Домен: группы платежей (категории).
 * Контракты — из shared; здесь реэкспорт для использования в сервисах и роутах.
 */

export type {
  PaymentGroup,
  PaymentGroupCreate,
  PaymentGroupUpdate,
} from "shared/payment-groups";
