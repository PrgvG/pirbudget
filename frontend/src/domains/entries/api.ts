/**
 * API записей (доходы и разовые расходы).
 */

import type { Entry, EntryCreate, EntryUpdate } from 'shared/entries';
import { apiJson, apiFetch } from '../../api/client';

export type FetchEntriesParams = {
  from?: string;
  to?: string;
  type?: 'income' | 'expense' | 'all';
  categoryId?: string;
};

function isEntryObject(obj: object): obj is Entry {
  const o = obj as Record<string, unknown>;
  if (o.direction !== 'income' && o.direction !== 'expense') return false;
  if (typeof o.id !== 'string' || typeof o.amount !== 'number' || typeof o.date !== 'string') return false;
  if (typeof o.createdAt !== 'string' || typeof o.updatedAt !== 'string') return false;
  return typeof o.categoryId === 'string' && (o.note === undefined || typeof o.note === 'string');
}

export function isEntry(data: unknown): data is Entry {
  return typeof data === 'object' && data !== null && isEntryObject(data);
}

export function isEntryArray(data: unknown): data is Entry[] {
  return Array.isArray(data) && data.every(isEntry);
}

function buildQuery(params: FetchEntriesParams): string {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.type && params.type !== 'all') search.set('type', params.type);
  if (params.categoryId) search.set('categoryId', params.categoryId);
  const q = search.toString();
  return q ? `?${q}` : '';
}

export async function fetchEntries(params: FetchEntriesParams = {}): Promise<Entry[]> {
  const query = buildQuery(params);
  return apiJson(`/api/entries${query}`, {}, isEntryArray);
}

export async function fetchEntry(id: string): Promise<Entry> {
  return apiJson(`/api/entries/${encodeURIComponent(id)}`, {}, isEntry);
}

export async function createEntry(data: EntryCreate): Promise<Entry> {
  return apiJson('/api/entries', { method: 'POST', body: data }, isEntry);
}

export async function updateEntry(id: string, data: EntryUpdate): Promise<Entry> {
  return apiJson(`/api/entries/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }, isEntry);
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await apiFetch(`/api/entries/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
