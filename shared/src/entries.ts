/**
 * Единая сущность «запись»: доход или расход с полем direction.
 * Объединяет поступления (income) и разовые платежи (expense).
 * Оба типа ссылаются на категорию через categoryId.
 */

import { z } from 'zod';
import { entityIdSchema, localIdSchema } from './ids.js';

const entryBaseSchema = z.object({
  id: entityIdSchema,
  amount: z.number(),
  /** ISO date YYYY-MM-DD */
  date: z.string(),
  categoryId: entityIdSchema,
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const entryIncomeSchema = entryBaseSchema.extend({
  direction: z.literal('income'),
});

const entryExpenseSchema = entryBaseSchema.extend({
  direction: z.literal('expense'),
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
  categoryId: entityIdSchema.optional(),
});

export const entryCreateSchema = entryCreateBase
  .extend({ localId: localIdSchema.optional() })
  .refine(data => data.categoryId != null && data.categoryId.trim() !== '', {
    message: 'Укажите категорию',
    path: ['categoryId'],
  });

export const entryUpdateSchema = entryCreateBase.partial();

export type Entry = z.infer<typeof entrySchema>;
export type EntryCreate = z.infer<typeof entryCreateSchema>;
export type EntryUpdate = z.infer<typeof entryUpdateSchema>;
