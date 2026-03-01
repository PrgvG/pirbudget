import { getToken } from '../lib/authStorage';

/**
 * Возвращает true, если пользователь не авторизован (нет токена) и нужен редирект на /login.
 */
export function shouldRedirectToLogin(): boolean {
  return !getToken();
}
