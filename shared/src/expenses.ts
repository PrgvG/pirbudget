/**
 * Расходы (платежи): базовый тип и размеченное объединение моментальный/повторяющийся.
 * Факт по повторяющимся — RecurringPaymentOccurrence.
 */

import type { EntityId } from "./ids.js";
import type { RecurrenceRule } from "./recurrence.js";

export type BaseExpensePayment = {
  id: EntityId;
  groupId: EntityId;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type InstantExpensePayment = BaseExpensePayment & {
  kind: "instant";
  amount: number;
  /** ISO date */
  date: string;
};

export type RecurringExpensePayment = BaseExpensePayment & {
  kind: "recurring";
  amountPerOccurrence: number;
  recurrence: RecurrenceRule;
  /** null = бесконечно */
  repeatCount: number | null;
};

export type ExpensePayment = InstantExpensePayment | RecurringExpensePayment;

export type RecurringPaymentOccurrenceStatus = "completed" | "skipped" | "pending";

export type RecurringPaymentOccurrence = {
  id: EntityId;
  recurringPaymentId: EntityId;
  scheduledDate: string;
  status: RecurringPaymentOccurrenceStatus;
  amount?: number;
  createdAt: string;
  updatedAt: string;
};

// DTO
export type InstantExpensePaymentCreate = Omit<InstantExpensePayment, "id" | "createdAt" | "updatedAt"> & {
  localId?: string;
};
export type InstantExpensePaymentUpdate = Partial<Omit<InstantExpensePayment, "id" | "createdAt" | "updatedAt">>;

export type RecurringExpensePaymentCreate = Omit<
  RecurringExpensePayment,
  "id" | "createdAt" | "updatedAt"
> & { localId?: string };
export type RecurringExpensePaymentUpdate = Partial<
  Omit<RecurringExpensePayment, "id" | "createdAt" | "updatedAt">
>;

export type RecurringPaymentOccurrenceCreate = Omit<
  RecurringPaymentOccurrence,
  "id" | "createdAt" | "updatedAt"
> & { localId?: string };
export type RecurringPaymentOccurrenceUpdate = Partial<
  Omit<RecurringPaymentOccurrence, "id" | "createdAt" | "updatedAt">
>;
