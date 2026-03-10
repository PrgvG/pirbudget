/**
 * API категорий (доходы и расходы). Вызовы к бэкенду и type guards для ответов.
 */

import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryDirection,
} from 'shared/categories';
import { apiJson, apiFetch } from '../../api/client';

function isCategoryObject(obj: object): obj is Category {
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.sortOrder === 'number' &&
    (o.direction === 'income' || o.direction === 'expense') &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string' &&
    (o.color === undefined || typeof o.color === 'string') &&
    (o.icon === undefined || typeof o.icon === 'string') &&
    (o.archived === undefined || typeof o.archived === 'boolean')
  );
}

export function isCategory(data: unknown): data is Category {
  return typeof data === 'object' && data !== null && isCategoryObject(data);
}

export function isCategoryArray(data: unknown): data is Category[] {
  return Array.isArray(data) && data.every(isCategory);
}

function categoriesUrl(direction?: CategoryDirection): string {
  const url = '/api/categories';
  if (direction != null) {
    return `${url}?direction=${encodeURIComponent(direction)}`;
  }
  return url;
}

function archivedUrl(direction?: CategoryDirection): string {
  const url = '/api/categories/archived';
  if (direction != null) {
    return `${url}?direction=${encodeURIComponent(direction)}`;
  }
  return url;
}

export async function fetchCategories(
  direction?: CategoryDirection
): Promise<Category[]> {
  return apiJson(categoriesUrl(direction), {}, isCategoryArray);
}

export async function fetchArchivedCategories(
  direction?: CategoryDirection
): Promise<Category[]> {
  return apiJson(archivedUrl(direction), {}, isCategoryArray);
}

export async function fetchCategory(id: string): Promise<Category> {
  return apiJson(`/api/categories/${encodeURIComponent(id)}`, {}, isCategory);
}

export async function createCategory(data: CategoryCreate): Promise<Category> {
  return apiJson('/api/categories', { method: 'POST', body: data }, isCategory);
}

export async function updateCategory(
  id: string,
  data: CategoryUpdate
): Promise<Category> {
  return apiJson(
    `/api/categories/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: data },
    isCategory
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await apiFetch(`/api/categories/${encodeURIComponent(id)}`, {
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
