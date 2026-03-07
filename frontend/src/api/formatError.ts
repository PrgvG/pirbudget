/**
 * Возвращает сообщение об ошибке для отображения пользователю.
 * Для типовых ответов API без текста подставляется понятная фраза.
 */
export function formatApiError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (
    message.startsWith('Request failed:') ||
    message === 'Invalid response shape'
  ) {
    return 'Не удалось сохранить. Проверьте данные и повторите попытку.';
  }
  return message;
}
