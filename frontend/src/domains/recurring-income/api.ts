/**
 * API повторяющихся доходов.
 */

import type {
  RecurringIncome,
  RecurringIncomeCreate,
  RecurringIncomeUpdate,
} from 'shared/recurring-income';
import { apiJson, apiFetch } from '../../api/client';

function isRecurringIncomeObject(obj: object): obj is RecurringIncome {
  const o = obj as Record<string, unknown>;
  return (
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

export function isRecurringIncome(data: unknown): data is RecurringIncome {
  return (
    typeof data === 'object' && data !== null && isRecurringIncomeObject(data)
  );
}

export function isRecurringIncomeArray(
  data: unknown
): data is RecurringIncome[] {
  return Array.isArray(data) && data.every(isRecurringIncome);
}

export async function fetchRecurringIncomes(): Promise<RecurringIncome[]> {
  return apiJson('/api/recurring-income', {}, isRecurringIncomeArray);
}

export async function fetchRecurringIncome(
  id: string
): Promise<RecurringIncome> {
  return apiJson(
    `/api/recurring-income/${encodeURIComponent(id)}`,
    {},
    isRecurringIncome
  );
}

export async function createRecurringIncome(
  data: RecurringIncomeCreate
): Promise<RecurringIncome> {
  return apiJson(
    '/api/recurring-income',
    { method: 'POST', body: data },
    isRecurringIncome
  );
}

export async function updateRecurringIncome(
  id: string,
  data: RecurringIncomeUpdate
): Promise<RecurringIncome> {
  return apiJson(
    `/api/recurring-income/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: data },
    isRecurringIncome
  );
}

export async function deleteRecurringIncome(id: string): Promise<void> {
  const res = await apiFetch(
    `/api/recurring-income/${encodeURIComponent(id)}`,
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
