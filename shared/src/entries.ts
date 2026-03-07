/**
 * Единая сущность «запись»: доход или расход с полем direction.
 * Объединяет поступления (income) и разовые платежи (expense).
 */

import { z } from 'zod';
import { entityIdSchema, localIdSchema } from './ids.js';

const entryIncomeSchema = z.object({
  direction: z.literal('income'),
  id: entityIdSchema,
  amount: z.number(),
  /** ISO date YYYY-MM-DD */
  date: z.string(),
  source: z.string(),
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const entryExpenseSchema = z.object({
  direction: z.literal('expense'),
  id: entityIdSchema,
  groupId: entityIdSchema,
  amount: z.number(),
  /** ISO date YYYY-MM-DD */
  date: z.string(),
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const entrySchema = z.discriminatedUnion('direction', [
  entryIncomeSchema,
  entryExpenseSchema,
]);

const entryCreateBase = z.object({
  direction: z.enum(['income', 'expense']),
  amount: z.number(),
  date: z.string(),
  note: z.string().optional(),
  source: z.string().optional(),
  groupId: entityIdSchema.optional(),
});

export const entryCreateSchema = entryCreateBase
  .extend({ localId: localIdSchema.optional() })
  .refine(
    data =>
      (data.direction === 'income' &&
        data.source != null &&
        data.source.trim() !== '') ||
      (data.direction === 'expense' && data.groupId != null),
    {
      message: 'Доход требует source, расход — groupId',
      path: ['direction'],
    }
  );

export const entryUpdateSchema = entryCreateBase.partial();

export type Entry = z.infer<typeof entrySchema>;
export type EntryCreate = z.infer<typeof entryCreateSchema>;
export type EntryUpdate = z.infer<typeof entryUpdateSchema>;
