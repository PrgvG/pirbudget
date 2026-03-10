/**
 * Общий справочник категорий для доходов и расходов.
 * Единый источник правды для фронтенда и бэкенда.
 * Категория имеет direction: 'income' | 'expense'.
 */

import { z } from 'zod';
import { entityIdSchema } from './ids.js';

export const directionSchema = z.enum(['income', 'expense']);

/** Схема сущности категории. */
export const categorySchema = z.object({
  id: entityIdSchema,
  name: z.string(),
  sortOrder: z.number().int().min(0),
  /** При отсутствии — фолбек на дефолтный "серый". */
  color: z.string().optional(),
  icon: z.string().optional(),
  /** true — категория в архиве (мягкое удаление). */
  archived: z.boolean().optional(),
  /** Доход или расход. */
  direction: directionSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Схема создания категории. */
export const categoryCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .transform(s => s.trim()),
  sortOrder: z.number().int().min(0),
  color: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  direction: directionSchema,
});

/** Схема обновления категории (все поля опциональны). */
export const categoryUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .transform(s => s.trim())
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
  color: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  direction: directionSchema.optional(),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type CategoryDirection = z.infer<typeof directionSchema>;
