/**
 * API повторяющихся расходов. Разовые расходы — в домене entries.
 */

import type {
  RecurringExpensePayment,
  RecurringExpensePaymentCreate,
  RecurringExpensePaymentUpdate,
} from 'shared/expenses';
import { apiJson, apiFetch } from '../../api/client';

function isRecurringExpensePaymentObject(
  obj: object
): obj is RecurringExpensePayment {
  const o = obj as Record<string, unknown>;
  return (
    o.kind === 'recurring' &&
    typeof o.id === 'string' &&
    typeof o.categoryId === 'string' &&
    typeof o.amountPerOccurrence === 'number' &&
    typeof o.recurrence === 'object' &&
    o.recurrence !== null &&
    typeof (o.recurrence as Record<string, unknown>).kind === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string' &&
    (o.note === undefined || typeof o.note === 'string') &&
    (o.repeatCount === undefined ||
      o.repeatCount === null ||
      typeof o.repeatCount === 'number')
  );
}

export function isRecurringExpensePayment(
  data: unknown
): data is RecurringExpensePayment {
  return (
    typeof data === 'object' &&
    data !== null &&
    isRecurringExpensePaymentObject(data)
  );
}

export function isRecurringExpensePaymentArray(
  data: unknown
): data is RecurringExpensePayment[] {
  return Array.isArray(data) && data.every(isRecurringExpensePayment);
}

export async function fetchRecurringExpenses(): Promise<
  RecurringExpensePayment[]
> {
  return apiJson('/api/expenses/recurring', {}, isRecurringExpensePaymentArray);
}

export async function fetchRecurringExpense(
  id: string
): Promise<RecurringExpensePayment> {
  return apiJson(
    `/api/expenses/recurring/${encodeURIComponent(id)}`,
    {},
    isRecurringExpensePayment
  );
}

export async function createRecurringExpense(
  data: RecurringExpensePaymentCreate
): Promise<RecurringExpensePayment> {
  return apiJson(
    '/api/expenses/recurring',
    { method: 'POST', body: data },
    isRecurringExpensePayment
  );
}

export async function updateRecurringExpense(
  id: string,
  data: RecurringExpensePaymentUpdate
): Promise<RecurringExpensePayment> {
  return apiJson(
    `/api/expenses/recurring/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: data },
    isRecurringExpensePayment
  );
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const res = await apiFetch(
    `/api/expenses/recurring/${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  );
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    const msg =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as Record<string, unknown>).error === 'string'
        ? (data as { error: string }).error
        : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
}
