/**
 * API поступлений (доходов). Вызовы к бэкенду и type guards для ответов.
 */

import type {
  IncomeEntry,
  IncomeEntryCreate,
  IncomeEntryUpdate,
} from 'shared/transactions';
import { apiJson, apiFetch } from '../../api/client';

function isIncomeEntryObject(obj: object): obj is IncomeEntry {
  const o = obj as Record<string, unknown>;
  return (
    o.direction === 'income' &&
    typeof o.id === 'string' &&
    typeof o.amount === 'number' &&
    typeof o.date === 'string' &&
    typeof o.source === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string' &&
    (o.note === undefined || typeof o.note === 'string')
  );
}

export function isIncomeEntry(data: unknown): data is IncomeEntry {
  return (
    typeof data === 'object' && data !== null && isIncomeEntryObject(data)
  );
}

export function isIncomeEntryArray(data: unknown): data is IncomeEntry[] {
  return Array.isArray(data) && data.every(isIncomeEntry);
}

export async function fetchIncomeEntries(): Promise<IncomeEntry[]> {
  return apiJson('/api/income-entries', {}, isIncomeEntryArray);
}

export async function fetchIncomeEntry(id: string): Promise<IncomeEntry> {
  return apiJson(
    `/api/income-entries/${encodeURIComponent(id)}`,
    {},
    isIncomeEntry
  );
}

export async function createIncomeEntry(
  data: IncomeEntryCreate
): Promise<IncomeEntry> {
  return apiJson(
    '/api/income-entries',
    { method: 'POST', body: data },
    isIncomeEntry
  );
}

export async function updateIncomeEntry(
  id: string,
  data: IncomeEntryUpdate
): Promise<IncomeEntry> {
  return apiJson(
    `/api/income-entries/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: data },
    isIncomeEntry
  );
}

export async function deleteIncomeEntry(id: string): Promise<void> {
  const res = await apiFetch(`/api/income-entries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
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
