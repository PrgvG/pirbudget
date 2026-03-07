/**
 * Валидация тела запросов для групп платежей.
 * Схемы — из shared; здесь только обёртки с кодами ошибок.
 */

import { z } from 'zod';
import {
  paymentGroupCreateSchema,
  paymentGroupUpdateSchema,
} from 'shared/payment-groups';

export type PaymentGroupCreateValid = {
  ok: true;
  data: z.infer<typeof paymentGroupCreateSchema>;
};

export type PaymentGroupCreateInvalid = {
  ok: false;
  error: string;
  code: string;
};

export type PaymentGroupUpdateValid = {
  ok: true;
  data: z.infer<typeof paymentGroupUpdateSchema>;
};

export type PaymentGroupUpdateInvalid = {
  ok: false;
  error: string;
  code: string;
};

function getFirstIssuePath(issues: z.ZodIssue[]): string | undefined {
  const raw = issues[0]?.path[0];
  return typeof raw === 'string' ? raw : undefined;
}

export function validatePaymentGroupCreate(
  body: unknown
): PaymentGroupCreateValid | PaymentGroupCreateInvalid {
  const result = paymentGroupCreateSchema.safeParse(body);
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
        : 'INVALID_BODY';
  return {
    ok: false,
    error: issue?.message ?? 'Invalid body',
    code,
  };
}

export function validatePaymentGroupUpdate(
  body: unknown
): PaymentGroupUpdateValid | PaymentGroupUpdateInvalid {
  const result = paymentGroupUpdateSchema.safeParse(body);
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
