/**
 * Валидация query-параметров для истории и плана операций.
 */

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const historyTypeValues = ['income', 'expense', 'all'] as const;

export type PlanQueryValid = {
  ok: true;
  data: { from: string; to: string };
};

export type PlanQueryInvalid = {
  ok: false;
  error: string;
  code: string;
};

export function validatePlanQuery(
  query: Record<string, unknown>
): PlanQueryValid | PlanQueryInvalid {
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
  return { ok: true, data: { from, to } };
}

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

const monthRegex = /^\d{4}-\d{2}$/;

export type MonthQueryValid = {
  ok: true;
  data: { month: string };
};

export type MonthQueryInvalid = {
  ok: false;
  error: string;
  code: string;
};

export function validateMonthQuery(
  query: Record<string, unknown>
): MonthQueryValid | MonthQueryInvalid {
  const month = query.month;
  if (typeof month !== 'string' || !monthRegex.test(month)) {
    return { ok: false, error: 'month must be YYYY-MM', code: 'INVALID_MONTH' };
  }
  const [y, m] = month.split('-').map(Number);
  if (m < 1 || m > 12) {
    return { ok: false, error: 'month must be 01-12', code: 'INVALID_MONTH' };
  }
  return { ok: true, data: { month } };
}
