/**
 * Валидация тела запросов для поступлений.
 * Схемы — из shared; здесь только обёртки с кодами ошибок.
 */

import { z } from 'zod';
import {
  incomeEntryCreateSchema,
  incomeEntryUpdateSchema,
} from 'shared/transactions';

export type IncomeEntryCreateValid = {
  ok: true;
  data: z.infer<typeof incomeEntryCreateSchema>;
};

export type IncomeEntryCreateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export type IncomeEntryUpdateValid = {
  ok: true;
  data: z.infer<typeof incomeEntryUpdateSchema>;
};

export type IncomeEntryUpdateInvalid = {
  ok: false;
  error: string;
  code: string;
};

function getFirstIssuePath(issues: z.ZodIssue[]): string | undefined {
  const raw = issues[0]?.path[0];
  return typeof raw === 'string' ? raw : undefined;
}

export function validateIncomeEntryCreate(
  body: unknown
): IncomeEntryCreateValid | IncomeEntryCreateInvalid {
  const result = incomeEntryCreateSchema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issue = result.error.issues[0];
  const path = getFirstIssuePath(result.error.issues);
  const code =
    path === 'amount'
      ? 'AMOUNT_INVALID'
      : path === 'date'
        ? 'DATE_INVALID'
        : path === 'source'
          ? 'SOURCE_REQUIRED'
          : 'INVALID_BODY';
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code,
  };
}

export function validateIncomeEntryUpdate(
  body: unknown
): IncomeEntryUpdateValid | IncomeEntryUpdateInvalid {
  const result = incomeEntryUpdateSchema.safeParse(body);
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
