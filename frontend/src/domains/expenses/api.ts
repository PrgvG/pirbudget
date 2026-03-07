/**
 * API расходов (разовые и повторяющиеся платежи). Вызовы к бэкенду и type guards.
 */

import type {
  InstantExpensePayment,
  RecurringExpensePayment,
  InstantExpensePaymentCreate,
  InstantExpensePaymentUpdate,
  RecurringExpensePaymentCreate,
  RecurringExpensePaymentUpdate,
} from 'shared/expenses';
import { apiJson, apiFetch } from '../../api/client';

function isInstantExpensePaymentObject(
  obj: object
): obj is InstantExpensePayment {
  const o = obj as Record<string, unknown>;
  return (
    o.kind === 'instant' &&
    typeof o.id === 'string' &&
    typeof o.groupId === 'string' &&
    typeof o.amount === 'number' &&
    typeof o.date === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string' &&
    (o.note === undefined || typeof o.note === 'string')
  );
}

function isRecurringExpensePaymentObject(
  obj: object
): obj is RecurringExpensePayment {
  const o = obj as Record<string, unknown>;
  return (
    o.kind === 'recurring' &&
    typeof o.id === 'string' &&
    typeof o.groupId === 'string' &&
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

export function isInstantExpensePayment(
  data: unknown
): data is InstantExpensePayment {
  return (
    typeof data === 'object' && data !== null && isInstantExpensePaymentObject(data)
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

export function isInstantExpensePaymentArray(
  data: unknown
): data is InstantExpensePayment[] {
  return Array.isArray(data) && data.every(isInstantExpensePayment);
}

export function isRecurringExpensePaymentArray(
  data: unknown
): data is RecurringExpensePayment[] {
  return Array.isArray(data) && data.every(isRecurringExpensePayment);
}

// --- Instant ---
export async function fetchInstantExpenses(): Promise<InstantExpensePayment[]> {
  return apiJson('/api/expenses/instant', {}, isInstantExpensePaymentArray);
}

export async function fetchInstantExpense(
  id: string
): Promise<InstantExpensePayment> {
  return apiJson(
    `/api/expenses/instant/${encodeURIComponent(id)}`,
    {},
    isInstantExpensePayment
  );
}

export async function createInstantExpense(
  data: InstantExpensePaymentCreate
): Promise<InstantExpensePayment> {
  return apiJson(
    '/api/expenses/instant',
    { method: 'POST', body: data },
    isInstantExpensePayment
  );
}

export async function updateInstantExpense(
  id: string,
  data: InstantExpensePaymentUpdate
): Promise<InstantExpensePayment> {
  return apiJson(
    `/api/expenses/instant/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: data },
    isInstantExpensePayment
  );
}

export async function deleteInstantExpense(id: string): Promise<void> {
  const res = await apiFetch(
    `/api/expenses/instant/${encodeURIComponent(id)}`,
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

// --- Recurring ---
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
