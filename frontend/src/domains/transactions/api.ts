/**
 * API операций (история за период).
 */

import type { Transaction } from 'shared/transactions';
import { apiJson } from '../../api/client';

export type HistoryParams = {
  from: string;
  to: string;
  type?: 'income' | 'expense' | 'all';
  groupId?: string;
};

function isIncomeEntryObject(obj: object): obj is Transaction {
  const o = obj as Record<string, unknown>;
  if (o.direction !== 'income') return false;
  return (
    typeof o.id === 'string' &&
    typeof o.amount === 'number' &&
    typeof o.date === 'string' &&
    typeof o.source === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string' &&
    (o.note === undefined || typeof o.note === 'string')
  );
}

function isExpenseEntryObject(obj: object): obj is Transaction {
  const o = obj as Record<string, unknown>;
  if (o.direction !== 'expense' || o.kind !== 'instant') return false;
  return (
    typeof o.id === 'string' &&
    typeof o.groupId === 'string' &&
    typeof o.amount === 'number' &&
    typeof o.date === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string' &&
    (o.note === undefined || typeof o.note === 'string')
  );
}

function isTransaction(data: unknown): data is Transaction {
  if (typeof data !== 'object' || data === null) return false;
  const o = data as Record<string, unknown>;
  if (o.direction === 'income') return isIncomeEntryObject(data as object);
  if (o.direction === 'expense') return isExpenseEntryObject(data as object);
  return false;
}

export function isTransactionArray(data: unknown): data is Transaction[] {
  return Array.isArray(data) && data.every(isTransaction);
}

function buildHistoryUrl(params: HistoryParams): string {
  const search = new URLSearchParams();
  search.set('from', params.from);
  search.set('to', params.to);
  if (params.type && params.type !== 'all') search.set('type', params.type);
  if (params.groupId) search.set('groupId', params.groupId);
  return `/api/transactions/history?${search.toString()}`;
}

export async function fetchHistory(params: HistoryParams): Promise<Transaction[]> {
  const url = buildHistoryUrl(params);
  return apiJson(url, {}, isTransactionArray);
}
