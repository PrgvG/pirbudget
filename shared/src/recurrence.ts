/**
 * Правило повторения платежей.
 * Используется только в повторяющихся расходах (RecurringExpensePayment).
 */

import { z } from 'zod';

export const recurrenceByIntervalSchema = z.object({
  kind: z.literal('interval'),
  unit: z.enum(['day', 'week', 'month', 'year']),
  /** Каждые N unit (1, 2, 3...) */
  interval: z.number().int().positive(),
  /** ISO date — от какой даты считать первую occurrence */
  anchorDate: z.string(),
  /** ISO date — опциональная дата окончания серии */
  endDate: z.string().optional(),
});

export const recurrenceByDateSchema = z.object({
  kind: z.literal('date'),
  /** ISO date — единственная дата платежа */
  date: z.string(),
});

export const recurrenceRuleSchema = z.discriminatedUnion('kind', [
  recurrenceByIntervalSchema,
  recurrenceByDateSchema,
]);

export type RecurrenceByInterval = z.infer<typeof recurrenceByIntervalSchema>;
export type RecurrenceByDate = z.infer<typeof recurrenceByDateSchema>;
export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;
