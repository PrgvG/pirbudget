/**
 * Идентификаторы сущностей.
 * В ответах API — id (MongoDB ObjectId в виде 24-символьной hex-строки или UUID).
 * В DTO создания опционально localId для офлайн/синхронизации.
 */

import { z } from 'zod';

const mongoObjectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, { message: 'Invalid id' });

/** Схема идентификатора сущности (ObjectId или UUID). */
export const entityIdSchema = z.union([
  z.uuid(),
  mongoObjectIdSchema,
]);

/** Схема локального id в DTO создания (для офлайн/синхронизации до получения id с сервера). */
export const localIdSchema = z.string();

/** Идентификатор сущности (ObjectId или UUID в ответах API). */
export type EntityId = z.infer<typeof entityIdSchema>;

/** Опциональный локальный id в DTO создания (для офлайн/синхронизации до получения id с сервера). */
export type LocalId = z.infer<typeof localIdSchema>;
