/**
 * Развёртывание правила повторения в список дат за период.
 * Используется для расчёта вхождений повторяющихся платежей.
 */

import type { RecurrenceRule } from './recurrence.js';

/** Нормализует строку даты до YYYY-MM-DD */
function toDateOnly(s: string): string {
  if (!s) return s;
  const idx = s.indexOf('T');
  return idx >= 0 ? s.slice(0, idx) : s;
}

/**
 * Возвращает даты вхождений по правилу повторения в диапазоне [from, to].
 * @param rule — правило (interval или date)
 * @param from — начало периода (YYYY-MM-DD)
 * @param to — конец периода (YYYY-MM-DD)
 * @param repeatCount — макс. число вхождений (null = без ограничения)
 */
export function expandRecurrence(
  rule: RecurrenceRule,
  from: string,
  to: string
): string[];
export function expandRecurrence(
  rule: RecurrenceRule,
  from: string,
  to: string,
  repeatCount: number | null
): string[];
export function expandRecurrence(
  rule: RecurrenceRule,
  from: string,
  to: string,
  repeatCount?: number | null
): string[] {
  const fromNorm = toDateOnly(from);
  const toNorm = toDateOnly(to);
  if (fromNorm > toNorm) return [];

  if (rule.kind === 'date') {
    const d = toDateOnly(rule.date);
    if (d >= fromNorm && d <= toNorm) return [d];
    return [];
  }

  // rule.kind === 'interval'
  const anchor = toDateOnly(rule.anchorDate);
  const endDate = rule.endDate ? toDateOnly(rule.endDate) : null;
  const maxCount = repeatCount ?? Infinity;
  const result: string[] = [];
  const unit = rule.unit;
  const interval = rule.interval;

  const toDate = new Date(toNorm + 'T23:59:59.999Z');
  const fromDate = new Date(fromNorm + 'T00:00:00.000Z');

  function addInterval(d: Date): Date {
    const next = new Date(d.getTime());
    switch (unit) {
      case 'day':
        next.setUTCDate(next.getUTCDate() + interval);
        break;
      case 'week':
        next.setUTCDate(next.getUTCDate() + 7 * interval);
        break;
      case 'month':
        next.setUTCMonth(next.getUTCMonth() + interval);
        break;
      case 'year':
        next.setUTCFullYear(next.getUTCFullYear() + interval);
        break;
    }
    return next;
  }

  let current = new Date(anchor + 'T12:00:00.000Z');
  const maxSeek = 100_000;
  let seek = 0;
  while (current.getTime() < fromDate.getTime() && seek < maxSeek) {
    current = addInterval(current);
    seek++;
  }
  if (seek >= maxSeek) return result;

  let count = 0;
  while (current.getTime() <= toDate.getTime() && count < maxCount) {
    const currentStr = current.toISOString().slice(0, 10);
    if (endDate && currentStr > endDate) break;
    result.push(currentStr);
    count++;
    current = addInterval(current);
  }

  return result;
}
