/**
 * API операций (история и план за период).
 */

import type { Transaction } from 'shared/transactions';
import type { PlannedItem } from 'shared';
import type { MonthStats } from './types';
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

// --- Plan ---

export type PlanParams = {
  from: string;
  to: string;
};

function isPlannedItem(obj: unknown): obj is PlannedItem {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  if (o.kind !== 'recurring' && o.kind !== 'instant') return false;
  return (
    typeof o.paymentId === 'string' &&
    typeof o.groupId === 'string' &&
    typeof o.scheduledDate === 'string' &&
    typeof o.amount === 'number' &&
    (o.note === undefined || typeof o.note === 'string')
  );
}

export function isPlannedItemArray(data: unknown): data is PlannedItem[] {
  return Array.isArray(data) && data.every(isPlannedItem);
}

function buildPlanUrl(params: PlanParams): string {
  const search = new URLSearchParams();
  search.set('from', params.from);
  search.set('to', params.to);
  return `/api/transactions/plan?${search.toString()}`;
}

export async function fetchPlan(params: PlanParams): Promise<PlannedItem[]> {
  const url = buildPlanUrl(params);
  return apiJson(url, {}, isPlannedItemArray);
}

// --- Month stats ---

function isMonthStats(data: unknown): data is MonthStats {
  if (typeof data !== 'object' || data === null) return false;
  const o = data as Record<string, unknown>;
  if (typeof o.month !== 'string') return false;
  if (typeof o.totalIncome !== 'number') return false;
  if (typeof o.totalExpense !== 'number') return false;
  if (typeof o.balance !== 'number') return false;
  if (!Array.isArray(o.expensesByGroup)) return false;
  for (const item of o.expensesByGroup) {
    if (typeof item !== 'object' || item === null) return false;
    const i = item as Record<string, unknown>;
    if (typeof i.groupId !== 'string' || typeof i.sum !== 'number') return false;
  }
  return true;
}

export async function fetchMonthStats(month: string): Promise<MonthStats> {
  const search = new URLSearchParams({ month });
  const url = `/api/transactions/stats?${search.toString()}`;
  return apiJson(url, {}, isMonthStats);
}
