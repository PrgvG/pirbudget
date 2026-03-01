/**
 * API групп платежей. Вызовы к бэкенду и type guards для ответов.
 */

import type {
  PaymentGroup,
  PaymentGroupCreate,
  PaymentGroupUpdate,
} from 'shared/payment-groups';
import { apiJson, apiFetch } from '../../api/client';

function isPaymentGroupObject(obj: object): obj is PaymentGroup {
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.sortOrder === 'number' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string' &&
    (o.color === undefined || typeof o.color === 'string') &&
    (o.icon === undefined || typeof o.icon === 'string')
  );
}

export function isPaymentGroup(data: unknown): data is PaymentGroup {
  return (
    typeof data === 'object' && data !== null && isPaymentGroupObject(data)
  );
}

export function isPaymentGroupArray(data: unknown): data is PaymentGroup[] {
  return Array.isArray(data) && data.every(isPaymentGroup);
}

export async function fetchPaymentGroups(): Promise<PaymentGroup[]> {
  return apiJson('/api/payment-groups', {}, isPaymentGroupArray);
}

export async function fetchPaymentGroup(id: string): Promise<PaymentGroup> {
  return apiJson(
    `/api/payment-groups/${encodeURIComponent(id)}`,
    {},
    isPaymentGroup
  );
}

export async function createPaymentGroup(
  data: PaymentGroupCreate
): Promise<PaymentGroup> {
  return apiJson(
    '/api/payment-groups',
    { method: 'POST', body: data },
    isPaymentGroup
  );
}

export async function updatePaymentGroup(
  id: string,
  data: PaymentGroupUpdate
): Promise<PaymentGroup> {
  return apiJson(
    `/api/payment-groups/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: data },
    isPaymentGroup
  );
}

export async function deletePaymentGroup(id: string): Promise<void> {
  const res = await apiFetch(`/api/payment-groups/${encodeURIComponent(id)}`, {
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
