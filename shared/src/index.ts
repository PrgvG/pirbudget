/**
 * Общие контракты данных для обмена между backend и frontend.
 * Типы по доменам: ids, payment-groups, recurrence, expenses, transactions.
 */

export type { EntityId, LocalId } from "./ids.js";
export type {
  PaymentGroup,
  PaymentGroupCreate,
  PaymentGroupUpdate,
} from "./payment-groups.js";
export type {
  RecurrenceByInterval,
  RecurrenceByDate,
  RecurrenceRule,
} from "./recurrence.js";
export { expandRecurrence } from "./recurrence-expand.js";
export type {
  PlannedItem,
  PlannedItemRecurring,
  PlannedItemInstant,
} from "./planned.js";
export type {
  BaseExpensePayment,
  InstantExpensePayment,
  RecurringExpensePayment,
  ExpensePayment,
  RecurringPaymentOccurrenceStatus,
  RecurringPaymentOccurrence,
  InstantExpensePaymentCreate,
  InstantExpensePaymentUpdate,
  RecurringExpensePaymentCreate,
  RecurringExpensePaymentUpdate,
  RecurringPaymentOccurrenceCreate,
  RecurringPaymentOccurrenceUpdate,
} from "./expenses.js";
export type {
  IncomeEntry,
  ExpenseEntry,
  Transaction,
  IncomeEntryCreate,
  IncomeEntryUpdate,
} from "./transactions.js";
export type { Entry, EntryCreate, EntryUpdate } from "./entries.js";
export { entrySchema, entryCreateSchema, entryUpdateSchema } from "./entries.js";
