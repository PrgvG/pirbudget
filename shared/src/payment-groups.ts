/**
 * Группы платежей (категории расходов).
 * Расходы ссылаются на группу через groupId.
 */

import { z } from 'zod';
import { entityIdSchema } from './ids.js';

/** Схема сущности группы платежей. */
export const paymentGroupSchema = z.object({
  id: entityIdSchema,
  name: z.string(),
  sortOrder: z.number().int().min(0),
  /** При отсутствии — фолбек на дефолтный "серый". */
  color: z.string().optional(),
  icon: z.string().optional(),
  /** true — группа в архиве (мягкое удаление). */
  archived: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Схема создания группы (валидация тела запроса — trim, min length для name). */
export const paymentGroupCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .transform(s => s.trim()),
  sortOrder: z.number().int().min(0),
  color: z.string().trim().optional(),
  icon: z.string().trim().optional(),
});

/** Схема обновления группы (все поля опциональны). */
export const paymentGroupUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .transform(s => s.trim())
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
  color: z.string().trim().optional(),
  icon: z.string().trim().optional(),
});

export type PaymentGroup = z.infer<typeof paymentGroupSchema>;
export type PaymentGroupCreate = z.infer<typeof paymentGroupCreateSchema>;
export type PaymentGroupUpdate = z.infer<typeof paymentGroupUpdateSchema>;
