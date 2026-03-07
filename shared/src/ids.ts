/**
 * Идентификаторы сущностей.
 * В ответах API — только id (UUID). В DTO создания опционально localId для офлайн/синхронизации.
 */

import { z } from 'zod';

/** Схема идентификатора сущности (UUID v4 в ответах API). */
export const entityIdSchema = z.string().uuid();

/** Схема локального id в DTO создания (для офлайн/синхронизации до получения id с сервера). */
export const localIdSchema = z.string();

/** Базовый идентификатор сущности (UUID v4 в ответах API). */
export type EntityId = z.infer<typeof entityIdSchema>;

/** Опциональный локальный id в DTO создания (для офлайн/синхронизации до получения id с сервера). */
export type LocalId = z.infer<typeof localIdSchema>;
