import { getToken, removeToken } from '../lib/authStorage';
import type { ZodTypeAny } from 'zod';
import type { infer as ZodInfer } from 'zod';

const getBaseUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL;
  return typeof base === 'string' && base ? base.replace(/\/$/, '') : '';
};

type OnUnauthorized = (() => void) | null;

let onUnauthorizedCallback: OnUnauthorized = null;

export function setOnUnauthorized(callback: OnUnauthorized): void {
  onUnauthorizedCallback = callback;
}

export type ApiRequestInit = Omit<RequestInit, 'body'> & {
  body?: object | string;
};

function isJsonBody(body: ApiRequestInit['body']): body is object {
  return (
    typeof body === 'object' && body !== null && !(body instanceof FormData)
  );
}

function toFetchBody(body: ApiRequestInit['body']): BodyInit | undefined {
  if (isJsonBody(body)) {
    return JSON.stringify(body);
  }
  if (typeof body === 'string') {
    return body;
  }
  return undefined;
}

export async function apiFetch(
  path: string,
  init: ApiRequestInit = {}
): Promise<Response> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getToken();

  const headers: Record<string, string> = {};
  if (typeof init.headers === 'object' && !(init.headers instanceof Headers)) {
    Object.assign(headers, init.headers);
  } else if (init.headers) {
    Object.assign(
      headers,
      Object.fromEntries(new Headers(init.headers).entries())
    );
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (isJsonBody(init.body)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body: toFetchBody(init.body),
  });

  if (response.status === 401 && onUnauthorizedCallback) {
    removeToken();
    onUnauthorizedCallback();
  }

  return response;
}

function hasErrorString(obj: object): obj is { error: string } {
  return (
    'error' in obj && typeof (obj as Record<string, unknown>).error === 'string'
  );
}

function getErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'object' && data !== null && hasErrorString(data)) {
    return data.error;
  }
  return `Request failed: ${status}`;
}

export async function apiJson<T>(
  path: string,
  init: ApiRequestInit = {},
  guard: (data: unknown) => data is T
): Promise<T> {
  const res = await apiFetch(path, init);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(getErrorMessage(data, res.status));
  }
  if (!guard(data)) {
    throw new Error('Invalid response shape');
  }
  return data;
}

type InferFromSchema<TSchema extends ZodTypeAny> = ZodInfer<TSchema>;

export function fromZodSchema<TSchema extends ZodTypeAny>(
  schema: TSchema
): (data: unknown) => data is InferFromSchema<TSchema> {
  return (data: unknown): data is InferFromSchema<TSchema> =>
    schema.safeParse(data).success;
}

export function fromZodArray<TSchema extends ZodTypeAny>(
  schema: TSchema
): (data: unknown) => data is InferFromSchema<TSchema>[] {
  return (data: unknown): data is InferFromSchema<TSchema>[] =>
    Array.isArray(data) &&
    data.every(item => schema.safeParse(item).success);
}
