/**
 * Единая сущность «операция»: доход и расход с различателем direction.
 * Общие правила и формы; для расхода — те же типы платежей с direction: "expense".
 */

import { z } from 'zod';
import { entityIdSchema, localIdSchema } from './ids.js';
import {
  instantExpensePaymentSchema,
  recurringExpensePaymentSchema,
} from './expenses.js';

export const incomeEntrySchema = z.object({
  direction: z.literal('income'),
  id: entityIdSchema,
  amount: z.number(),
  /** ISO date */
  date: z.string(),
  categoryId: entityIdSchema,
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const expenseEntrySchema = z.union([
  instantExpensePaymentSchema.extend({
    direction: z.literal('expense'),
  }),
  recurringExpensePaymentSchema.extend({
    direction: z.literal('expense'),
  }),
]);

export const transactionSchema = z.union([
  incomeEntrySchema,
  expenseEntrySchema,
]);

export const incomeEntryCreateSchema = incomeEntrySchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({ localId: localIdSchema.optional() });

export const incomeEntryUpdateSchema = incomeEntrySchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export type IncomeEntry = z.infer<typeof incomeEntrySchema>;
export type ExpenseEntry = z.infer<typeof expenseEntrySchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type IncomeEntryCreate = z.infer<typeof incomeEntryCreateSchema>;
export type IncomeEntryUpdate = z.infer<typeof incomeEntryUpdateSchema>;
