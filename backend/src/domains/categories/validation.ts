/**
 * Валидация тела запросов для категорий.
 * Схемы — из shared; здесь только обёртки с кодами ошибок.
 */

import { z } from 'zod';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from 'shared/categories';

export type CategoryCreateValid = {
  ok: true;
  data: z.infer<typeof categoryCreateSchema>;
};

export type CategoryCreateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export type CategoryUpdateValid = {
  ok: true;
  data: z.infer<typeof categoryUpdateSchema>;
};

export type CategoryUpdateInvalid = {
  ok: false;
  error: string;
  code: string;
};

function getFirstIssuePath(issues: z.ZodIssue[]): string | undefined {
  const raw = issues[0]?.path[0];
  return typeof raw === 'string' ? raw : undefined;
}

export function validateCategoryCreate(
  body: unknown
): CategoryCreateValid | CategoryCreateInvalid {
  const result = categoryCreateSchema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issue = result.error.issues[0];
  const path = getFirstIssuePath(result.error.issues);
  const code =
    path === 'name'
      ? 'NAME_REQUIRED'
      : path === 'sortOrder'
        ? 'SORT_ORDER_INVALID'
        : path === 'direction'
          ? 'DIRECTION_INVALID'
          : 'INVALID_BODY';
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code,
  };
}

export function validateCategoryUpdate(
  body: unknown
): CategoryUpdateValid | CategoryUpdateInvalid {
  const result = categoryUpdateSchema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issue = result.error.issues[0];
  const code = 'INVALID_BODY';
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code,
  };
}
