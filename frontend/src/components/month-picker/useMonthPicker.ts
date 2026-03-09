import { useState, useMemo, useCallback } from 'react';

export function currentMonthStr(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getMonthBounds(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split('-').map(Number);
  const from = `${monthStr}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export type UseMonthPickerOptions = {
  /** Начальный месяц YYYY-MM. По умолчанию — текущий. */
  initialMonth?: string;
  /** Минимальный месяц YYYY-MM (например '2000-01'). */
  minMonth?: string;
  /** Максимальный месяц YYYY-MM. Не задан — без ограничения (для Плана). */
  maxMonth?: string;
};

export function useMonthPicker(options: UseMonthPickerOptions = {}) {
  const {
    initialMonth = currentMonthStr(),
    minMonth = '2000-01',
    maxMonth,
  } = options;

  const [month, setMonth] = useState(initialMonth);

  const { from, to } = useMemo(() => getMonthBounds(month), [month]);

  const monthLabel = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const day = '01';
    const monthStr = String(m).padStart(2, '0');
    return `${day}.${monthStr}.${y}`;
  }, [month]);

  const canPrev = month > minMonth;
  const canNext = maxMonth !== undefined ? month < maxMonth : true;

  const handlePrevMonth = useCallback(() => {
    const [y, m] = month.split('-').map(Number);
    const prev = m === 1 ? [y - 1, 12] : [y, m - 1];
    setMonth(`${prev[0]}-${String(prev[1]).padStart(2, '0')}`);
  }, [month]);

  const handleNextMonth = useCallback(() => {
    const [y, m] = month.split('-').map(Number);
    const next = m === 12 ? [y + 1, 1] : [y, m + 1];
    setMonth(`${next[0]}-${String(next[1]).padStart(2, '0')}`);
  }, [month]);

  const handleMonthChange = useCallback((value: string) => {
    if (!value) return;
    setMonth(value.slice(0, 7));
  }, []);

  return {
    month,
    setMonth,
    from,
    to,
    monthLabel,
    handlePrevMonth,
    handleNextMonth,
    handleMonthChange,
    canPrev,
    canNext,
  };
}
