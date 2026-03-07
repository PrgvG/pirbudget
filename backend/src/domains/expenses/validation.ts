/**
 * Валидация тела запросов для расходов (разовые и повторяющиеся).
 * Схемы — из shared; здесь обёртки с кодами ошибок и нормализация даты.
 */

import { z } from 'zod';
import {
  instantExpensePaymentCreateSchema,
  instantExpensePaymentUpdateSchema,
  recurringExpensePaymentCreateSchema,
  recurringExpensePaymentUpdateSchema,
} from 'shared/expenses';

function getFirstIssuePath(issues: z.ZodIssue[]): string | undefined {
  const raw = issues[0]?.path[0];
  return typeof raw === 'string' ? raw : undefined;
}

/** Нормализует date в body: YYYY-MM-DD → full ISO datetime для прохождения z.iso.datetime() */
function normalizeDateInBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) return body;
  const o = body as Record<string, unknown>;
  if (typeof o.date !== 'string') return body;
  const dateStr = o.date.trim();
  if (dateStr.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { ...o, date: `${dateStr}T00:00:00.000Z` };
  }
  return body;
}

// Instant
export type InstantExpensePaymentCreateValid = {
  ok: true;
  data: z.infer<typeof instantExpensePaymentCreateSchema>;
};

export type InstantExpensePaymentCreateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export type InstantExpensePaymentUpdateValid = {
  ok: true;
  data: z.infer<typeof instantExpensePaymentUpdateSchema>;
};

export type InstantExpensePaymentUpdateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export function validateInstantExpensePaymentCreate(
  body: unknown
): InstantExpensePaymentCreateValid | InstantExpensePaymentCreateInvalid {
  const normalized = normalizeDateInBody(body);
  const result = instantExpensePaymentCreateSchema.safeParse(normalized);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issue = result.error.issues[0];
  const path = getFirstIssuePath(result.error.issues);
  const code =
    path === 'groupId'
      ? 'GROUP_REQUIRED'
      : path === 'amount'
        ? 'AMOUNT_INVALID'
        : path === 'date'
          ? 'DATE_INVALID'
          : 'INVALID_BODY';
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code,
  };
}

export function validateInstantExpensePaymentUpdate(
  body: unknown
): InstantExpensePaymentUpdateValid | InstantExpensePaymentUpdateInvalid {
  const normalized = normalizeDateInBody(body);
  const result = instantExpensePaymentUpdateSchema.safeParse(normalized);
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
        : 'INVALID_BODY';
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code,
  };
}

// Recurring
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
  const code = 'INVALID_BODY';
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code,
  };
}
