/**
 * Правило повторения платежей.
 * Используется только в повторяющихся расходах (RecurringExpensePayment).
 */

export type RecurrenceByInterval = {
  kind: "interval";
  unit: "day" | "week" | "month" | "year";
  /** Каждые N unit (1, 2, 3...) */
  interval: number;
  /** ISO date — от какой даты считать первую occurrence */
  anchorDate: string;
  /** ISO date — опциональная дата окончания серии */
  endDate?: string;
};

export type RecurrenceByDate = {
  kind: "date";
  /** ISO date — единственная дата платежа */
  date: string;
};

export type RecurrenceRule = RecurrenceByInterval | RecurrenceByDate;
