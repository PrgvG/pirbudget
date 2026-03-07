/**
 * Валидация query-параметров для истории операций.
 */

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const historyTypeValues = ['income', 'expense', 'all'] as const;

export type HistoryQueryValid = {
  ok: true;
  data: {
    from: string;
    to: string;
    type: 'income' | 'expense' | 'all';
    groupId?: string;
  };
};

export type HistoryQueryInvalid = {
  ok: false;
  error: string;
  code: string;
};

export function validateHistoryQuery(query: Record<string, unknown>): HistoryQueryValid | HistoryQueryInvalid {
  const from = query.from;
  const to = query.to;
  if (typeof from !== 'string' || !dateRegex.test(from)) {
    return { ok: false, error: 'from must be YYYY-MM-DD', code: 'INVALID_FROM' };
  }
  if (typeof to !== 'string' || !dateRegex.test(to)) {
    return { ok: false, error: 'to must be YYYY-MM-DD', code: 'INVALID_TO' };
  }
  if (from > to) {
    return { ok: false, error: 'from must be <= to', code: 'INVALID_RANGE' };
  }
  let type: 'income' | 'expense' | 'all' = 'all';
  if (query.type !== undefined) {
    if (typeof query.type !== 'string' || !historyTypeValues.includes(query.type as typeof historyTypeValues[number])) {
      return { ok: false, error: 'type must be income, expense or all', code: 'INVALID_TYPE' };
    }
    type = query.type as 'income' | 'expense' | 'all';
  }
  let groupId: string | undefined;
  if (query.groupId !== undefined && query.groupId !== '') {
    if (typeof query.groupId !== 'string') {
      return { ok: false, error: 'groupId must be a string', code: 'INVALID_GROUP_ID' };
    }
    groupId = query.groupId;
  }
  return { ok: true, data: { from, to, type, groupId } };
}
