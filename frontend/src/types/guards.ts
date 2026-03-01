import type { AuthResponse, User } from './index';

function hasTokenAndUser(obj: object): obj is AuthResponse {
  const o = obj as Record<string, unknown>;
  return (
    typeof o.token === 'string' && typeof o.user === 'object' && o.user !== null
  );
}

export function isAuthResponse(data: unknown): data is AuthResponse {
  return typeof data === 'object' && data !== null && hasTokenAndUser(data);
}

function isUserObject(obj: object): obj is User {
  const o = obj as Record<string, unknown>;
  return (
    typeof o._id === 'string' &&
    typeof o.email === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string' &&
    (o.name === undefined || typeof o.name === 'string')
  );
}

export function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && isUserObject(data);
}

export function isUserArray(data: unknown): data is User[] {
  return Array.isArray(data) && data.every(isUser);
}

export function isApiMessage(data: unknown): data is { message: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).message === 'string'
  );
}

type LocationStateFrom = { from?: { pathname: string } };

export function hasFromPath(state: unknown): state is LocationStateFrom {
  if (state === null || state === undefined || typeof state !== 'object')
    return true;
  if (!('from' in state)) return true;
  const from = (state as Record<string, unknown>)['from'];
  if (from === null || from === undefined) return true;
  return (
    typeof from === 'object' &&
    typeof (from as Record<string, unknown>)['pathname'] === 'string'
  );
}

export function getFromPath(state: unknown): string {
  if (!hasFromPath(state) || !state?.from?.pathname) return '/';
  return state.from.pathname;
}
