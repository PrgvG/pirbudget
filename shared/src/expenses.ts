/**
 * Расходы (платежи): базовый тип и размеченное объединение моментальный/повторяющийся.
 * Факт по повторяющимся — RecurringPaymentOccurrence.
 */

import { z } from 'zod';
import { entityIdSchema, localIdSchema } from './ids.js';
import { recurrenceRuleSchema } from './recurrence.js';

const baseExpensePaymentSchema = z.object({
  id: entityIdSchema,
  groupId: entityIdSchema,
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const instantExpensePaymentSchema = baseExpensePaymentSchema.extend({
  kind: z.literal('instant'),
  amount: z.number(),
  /** ISO date */
  date: z.iso.datetime(),
});

export const recurringExpensePaymentSchema = baseExpensePaymentSchema.extend({
  kind: z.literal('recurring'),
  amountPerOccurrence: z.number(),
  recurrence: recurrenceRuleSchema,
  /** null = бесконечно */
  repeatCount: z.number().int().nonnegative().nullable(),
});

export const expensePaymentSchema = z.discriminatedUnion('kind', [
  instantExpensePaymentSchema,
  recurringExpensePaymentSchema,
]);

export const recurringPaymentOccurrenceStatusSchema = z.enum([
  'completed',
  'skipped',
  'pending',
]);

export const recurringPaymentOccurrenceSchema = z.object({
  id: entityIdSchema,
  recurringPaymentId: entityIdSchema,
  scheduledDate: z.string(),
  status: recurringPaymentOccurrenceStatusSchema,
  amount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// DTO Create/Update
export const instantExpensePaymentCreateSchema = instantExpensePaymentSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({ localId: localIdSchema.optional() });

export const instantExpensePaymentUpdateSchema = instantExpensePaymentSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export const recurringExpensePaymentCreateSchema = recurringExpensePaymentSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({ localId: localIdSchema.optional() });

export const recurringExpensePaymentUpdateSchema = recurringExpensePaymentSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export const recurringPaymentOccurrenceCreateSchema =
  recurringPaymentOccurrenceSchema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .extend({ localId: localIdSchema.optional() });

export const recurringPaymentOccurrenceUpdateSchema =
  recurringPaymentOccurrenceSchema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .partial();

export type BaseExpensePayment = z.infer<typeof baseExpensePaymentSchema>;
export type InstantExpensePayment = z.infer<typeof instantExpensePaymentSchema>;
export type RecurringExpensePayment = z.infer<
  typeof recurringExpensePaymentSchema
>;
export type ExpensePayment = z.infer<typeof expensePaymentSchema>;
export type RecurringPaymentOccurrenceStatus = z.infer<
  typeof recurringPaymentOccurrenceStatusSchema
>;
export type RecurringPaymentOccurrence = z.infer<
  typeof recurringPaymentOccurrenceSchema
>;
export type InstantExpensePaymentCreate = z.infer<
  typeof instantExpensePaymentCreateSchema
>;
export type InstantExpensePaymentUpdate = z.infer<
  typeof instantExpensePaymentUpdateSchema
>;
export type RecurringExpensePaymentCreate = z.infer<
  typeof recurringExpensePaymentCreateSchema
>;
export type RecurringExpensePaymentUpdate = z.infer<
  typeof recurringExpensePaymentUpdateSchema
>;
export type RecurringPaymentOccurrenceCreate = z.infer<
  typeof recurringPaymentOccurrenceCreateSchema
>;
export type RecurringPaymentOccurrenceUpdate = z.infer<
  typeof recurringPaymentOccurrenceUpdateSchema
>;
