/**
 * Валидация тела запросов для повторяющихся расходов.
 */

import { z } from 'zod';
import {
  recurringExpensePaymentCreateSchema,
  recurringExpensePaymentUpdateSchema,
} from 'shared/expenses';

function getFirstIssuePath(issues: z.ZodIssue[]): string | undefined {
  const raw = issues[0]?.path[0];
  return typeof raw === 'string' ? raw : undefined;
}

export type RecurringExpensePaymentCreateValid = {
  ok: true;
  data: z.infer<typeof recurringExpensePaymentCreateSchema>;
};

export type RecurringExpensePaymentCreateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export type RecurringExpensePaymentUpdateValid = {
  ok: true;
  data: z.infer<typeof recurringExpensePaymentUpdateSchema>;
};

export type RecurringExpensePaymentUpdateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export function validateRecurringExpensePaymentCreate(
  body: unknown
): RecurringExpensePaymentCreateValid | RecurringExpensePaymentCreateInvalid {
  const result = recurringExpensePaymentCreateSchema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issue = result.error.issues[0];
  const path = getFirstIssuePath(result.error.issues);
  const code =
    path === 'groupId'
      ? 'GROUP_REQUIRED'
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

export function validateRecurringExpensePaymentUpdate(
  body: unknown
): RecurringExpensePaymentUpdateValid | RecurringExpensePaymentUpdateInvalid {
  const result = recurringExpensePaymentUpdateSchema.safeParse(body);
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
