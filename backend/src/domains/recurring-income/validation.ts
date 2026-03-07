/**
 * Валидация тела запросов для повторяющихся доходов.
 */

import { z } from 'zod';
import {
  recurringIncomeCreateSchema,
  recurringIncomeUpdateSchema,
} from 'shared/recurring-income';

function getFirstIssuePath(issues: z.ZodIssue[]): string | undefined {
  const raw = issues[0]?.path[0];
  return typeof raw === 'string' ? raw : undefined;
}

export type RecurringIncomeCreateValid = {
  ok: true;
  data: z.infer<typeof recurringIncomeCreateSchema>;
};

export type RecurringIncomeCreateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export type RecurringIncomeUpdateValid = {
  ok: true;
  data: z.infer<typeof recurringIncomeUpdateSchema>;
};

export type RecurringIncomeUpdateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export function validateRecurringIncomeCreate(
  body: unknown
): RecurringIncomeCreateValid | RecurringIncomeCreateInvalid {
  const result = recurringIncomeCreateSchema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issue = result.error.issues[0];
  const path = getFirstIssuePath(result.error.issues);
  const code =
    path === 'categoryId'
      ? 'CATEGORY_ID_REQUIRED'
      : path === 'amountPerOccurrence'
        ? 'AMOUNT_INVALID'
        : path === 'recurrence'
          ? 'RECURRENCE_INVALID'
          : 'INVALID_BODY';
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code,
  };
}

export function validateRecurringIncomeUpdate(
  body: unknown
): RecurringIncomeUpdateValid | RecurringIncomeUpdateInvalid {
  const result = recurringIncomeUpdateSchema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issue = result.error.issues[0];
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code: 'INVALID_BODY',
  };
}
