/**
 * Типы для экрана «План»: запланированные платежи на период.
 * Элементы плана — вычисленные вхождения повторяющихся + разовые с датой в периоде.
 */

import { z } from 'zod';
import { entityIdSchema } from './ids.js';

export const plannedItemRecurringSchema = z.object({
  kind: z.literal('recurring'),
  paymentId: entityIdSchema,
  categoryId: entityIdSchema,
  scheduledDate: z.string(),
  amount: z.number(),
  note: z.string().optional(),
});

export const plannedItemInstantSchema = z.object({
  kind: z.literal('instant'),
  paymentId: entityIdSchema,
  categoryId: entityIdSchema,
  scheduledDate: z.string(),
  amount: z.number(),
  note: z.string().optional(),
});

export const plannedItemRecurringIncomeSchema = z.object({
  kind: z.literal('recurringIncome'),
  paymentId: entityIdSchema,
  categoryId: entityIdSchema,
  scheduledDate: z.string(),
  amount: z.number(),
  note: z.string().optional(),
});

export const plannedItemSchema = z.discriminatedUnion('kind', [
  plannedItemRecurringSchema,
  plannedItemInstantSchema,
  plannedItemRecurringIncomeSchema,
]);

export type PlannedItemRecurring = z.infer<typeof plannedItemRecurringSchema>;
export type PlannedItemInstant = z.infer<typeof plannedItemInstantSchema>;
export type PlannedItemRecurringIncome = z.infer<
  typeof plannedItemRecurringIncomeSchema
>;
export type PlannedItem = z.infer<typeof plannedItemSchema>;
