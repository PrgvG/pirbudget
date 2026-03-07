/**
 * Повторяющиеся доходы (например зарплата).
 * recurrence — то же правило, что и для повторяющихся расходов.
 */

import { z } from 'zod';
import { entityIdSchema, localIdSchema } from './ids.js';
import { recurrenceRuleSchema } from './recurrence.js';

export const recurringIncomeSchema = z.object({
  id: entityIdSchema,
  categoryId: entityIdSchema,
  amountPerOccurrence: z.number(),
  recurrence: recurrenceRuleSchema,
  /** null = бесконечно */
  repeatCount: z.number().int().nonnegative().nullable(),
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const recurringIncomeCreateSchema = recurringIncomeSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({ localId: localIdSchema.optional() });

export const recurringIncomeUpdateSchema = recurringIncomeSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export type RecurringIncome = z.infer<typeof recurringIncomeSchema>;
export type RecurringIncomeCreate = z.infer<typeof recurringIncomeCreateSchema>;
export type RecurringIncomeUpdate = z.infer<typeof recurringIncomeUpdateSchema>;
