import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { Entry, EntryCreate, EntryUpdate } from 'shared/entries';
import type { RecurringExpensePayment } from 'shared/expenses';
import type { RecurringIncome } from 'shared/recurring-income';
import type { RecurrenceByInterval, RecurrenceByDate } from 'shared/recurrence';
import { fetchCategories } from '../domains/categories';
import {
  fetchEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../domains/entries';
import {
  fetchRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from '../domains/expenses';
import {
  fetchRecurringIncomes,
  createRecurringIncome,
  updateRecurringIncome,
  deleteRecurringIncome,
} from '../domains/recurring-income';
import { formatApiError } from '../api/formatError';
import styles from './TransactionsPage.module.css';

const ENTRIES_QUERY_KEY = ['entries'] as const;
const CATEGORIES_QUERY_KEY = ['categories'] as const;
const RECURRING_EXPENSE_QUERY_KEY = ['expenses', 'recurring'] as const;
const RECURRING_INCOME_QUERY_KEY = ['recurring-income'] as const;

type EntryFilterType = 'all' | 'income' | 'expense';
type EditingType = 'entry' | 'recurringExpense' | 'recurringIncome' | null;

function formatDate(isoDate: string): string {
  try {
    const d = isoDate.slice(0, 10);
    return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate.slice(0, 10);
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDateTime(dateStr: string): string {
  if (!dateStr || dateStr.length > 10) return dateStr;
  return `${dateStr}T00:00:00.000Z`;
}

function describeRecurrence(r: RecurrenceByInterval | RecurrenceByDate): string {
  if (r.kind === 'date') {
    return formatDate(r.date);
  }
  const units: Record<string, string> = {
    day: 'день',
    week: 'неделя',
    month: 'месяц',
    year: 'год',
  };
  const u = units[r.unit] ?? r.unit;
  const every = r.interval === 1 ? `каждый ${u}` : `каждые ${r.interval} ${u}`;
  return `${every} с ${formatDate(r.anchorDate)}`;
}

// --- Unified form state ---
type UnifiedFormState = {
  direction: 'income' | 'expense';
  schedule: 'date' | 'interval';
  amount: number;
  note: string;
  categoryId: string;
  date: string;
  unit: 'day' | 'week' | 'month' | 'year';
  interval: number;
  anchorDate: string;
  endDate: string;
  repeatCount: string;
  recurrenceDate: string;
};

function emptyUnifiedForm(): UnifiedFormState {
  return {
    direction: 'income',
    schedule: 'date',
    amount: 0,
    note: '',
    categoryId: '',
    date: todayISO(),
    unit: 'month',
    interval: 1,
    anchorDate: todayISO(),
    endDate: '',
    repeatCount: '',
    recurrenceDate: todayISO(),
  };
}

function formToRecurrence(f: UnifiedFormState): RecurrenceByInterval | RecurrenceByDate {
  if (f.schedule === 'date') {
    return { kind: 'date', date: toIsoDateTime(f.date) };
  }
  return {
    kind: 'interval',
    unit: f.unit,
    interval: f.interval,
    anchorDate: toIsoDateTime(f.anchorDate),
    ...(f.endDate.trim() && { endDate: toIsoDateTime(f.endDate) }),
  };
}

function formToEntryCreate(f: UnifiedFormState): EntryCreate | null {
  if (!f.categoryId.trim()) return null;
  return {
    direction: f.direction,
    amount: f.amount,
    date: f.date.trim(),
    categoryId: f.categoryId.trim(),
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function formToEntryUpdate(f: UnifiedFormState): EntryUpdate {
  const u: EntryUpdate = {};
  if (f.amount !== undefined) u.amount = f.amount;
  if (f.date.trim()) u.date = f.date.trim();
  if (f.categoryId.trim()) u.categoryId = f.categoryId.trim();
  u.note = f.note.trim() || undefined;
  return u;
}

function formToRecurringExpenseCreate(
  f: UnifiedFormState
): Parameters<typeof createRecurringExpense>[0] | null {
  if (!f.categoryId.trim()) return null;
  const repeatCount =
    f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  const validRepeat =
    repeatCount === null ||
    (Number.isInteger(repeatCount) && repeatCount >= 0);
  return {
    kind: 'recurring',
    categoryId: f.categoryId.trim(),
    amountPerOccurrence: f.amount,
    recurrence: formToRecurrence(f),
    repeatCount: validRepeat ? repeatCount : null,
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function formToRecurringExpenseUpdate(
  f: UnifiedFormState
): Parameters<typeof updateRecurringExpense>[1] {
  const repeatCount =
    f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  return {
    categoryId: f.categoryId.trim(),
    amountPerOccurrence: f.amount,
    recurrence: formToRecurrence(f),
    repeatCount:
      repeatCount === null ||
      (Number.isInteger(repeatCount) && repeatCount >= 0)
        ? repeatCount
        : undefined,
    note: f.note.trim() || undefined,
  };
}

function formToRecurringIncomeCreate(
  f: UnifiedFormState
): Parameters<typeof createRecurringIncome>[0] | null {
  if (!f.categoryId.trim()) return null;
  const repeatCount =
    f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  const validRepeat =
    repeatCount === null ||
    (Number.isInteger(repeatCount) && repeatCount >= 0);
  return {
    categoryId: f.categoryId.trim(),
    amountPerOccurrence: f.amount,
    recurrence: formToRecurrence(f),
    repeatCount: validRepeat ? repeatCount : null,
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function formToRecurringIncomeUpdate(
  f: UnifiedFormState
): Parameters<typeof updateRecurringIncome>[1] {
  const repeatCount =
    f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  return {
    categoryId: f.categoryId.trim(),
    amountPerOccurrence: f.amount,
    recurrence: formToRecurrence(f),
    repeatCount:
      repeatCount === null ||
      (Number.isInteger(repeatCount) && repeatCount >= 0)
        ? repeatCount
        : undefined,
    note: f.note.trim() || undefined,
  };
}

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [entryFilter, setEntryFilter] = useState<EntryFilterType>('all');
  const [unifiedForm, setUnifiedForm] = useState<UnifiedFormState>(emptyUnifiedForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<EditingType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryDeleteConfirmId, setEntryDeleteConfirmId] = useState<string | null>(null);
  const [recurringExpenseDeleteId, setRecurringExpenseDeleteId] = useState<string | null>(null);
  const [recurringIncomeDeleteId, setRecurringIncomeDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoriesIncomeQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, 'income'],
    queryFn: () => fetchCategories('income'),
  });
  const categoriesExpenseQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, 'expense'],
    queryFn: () => fetchCategories('expense'),
  });
  const categories =
    unifiedForm.direction === 'income'
      ? categoriesIncomeQuery.data ?? []
      : categoriesExpenseQuery.data ?? [];
  const categoryMap = useMemo(() => {
    const m = new Map<string, { name: string; color?: string; icon?: string }>();
    for (const c of categoriesIncomeQuery.data ?? []) {
      m.set(c.id, { name: c.name, color: c.color, icon: c.icon });
    }
    for (const c of categoriesExpenseQuery.data ?? []) {
      m.set(c.id, { name: c.name, color: c.color, icon: c.icon });
    }
    return m;
  }, [categoriesIncomeQuery.data, categoriesExpenseQuery.data]);
  const entriesQuery = useQuery({
    queryKey: [...ENTRIES_QUERY_KEY, entryFilter],
    queryFn: () =>
      fetchEntries({
        type: entryFilter === 'all' ? undefined : entryFilter,
      }),
  });
  const recurringExpenseQuery = useQuery({
    queryKey: RECURRING_EXPENSE_QUERY_KEY,
    queryFn: fetchRecurringExpenses,
  });
  const recurringIncomeQuery = useQuery({
    queryKey: RECURRING_INCOME_QUERY_KEY,
    queryFn: fetchRecurringIncomes,
  });

  const entries = entriesQuery.data ?? [];
  const recurringExpenseList = recurringExpenseQuery.data ?? [];
  const recurringIncomeList = recurringIncomeQuery.data ?? [];

  const createEntryMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setEditingType(null);
      setEditingId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntryUpdate }) =>
      updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setEditingType(null);
      setEditingId(null);
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setEntryDeleteConfirmId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const createRecurringExpenseMutation = useMutation({
    mutationFn: createRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY });
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setEditingType(null);
      setEditingId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const updateRecurringExpenseMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateRecurringExpense>[1];
    }) => updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY });
      setEditingType(null);
      setEditingId(null);
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const deleteRecurringExpenseMutation = useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY });
      setRecurringExpenseDeleteId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const createRecurringIncomeMutation = useMutation({
    mutationFn: createRecurringIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_INCOME_QUERY_KEY });
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setEditingType(null);
      setEditingId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const updateRecurringIncomeMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateRecurringIncome>[1];
    }) => updateRecurringIncome(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_INCOME_QUERY_KEY });
      setEditingType(null);
      setEditingId(null);
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const deleteRecurringIncomeMutation = useMutation({
    mutationFn: deleteRecurringIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_INCOME_QUERY_KEY });
      setRecurringIncomeDeleteId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const handleOpenCreate = () => {
    setEditingType(null);
    setEditingId(null);
    setFormOpen(true);
    setUnifiedForm({
      ...emptyUnifiedForm(),
      date: todayISO(),
      anchorDate: todayISO(),
      recurrenceDate: todayISO(),
      categoryId: (categoriesIncomeQuery.data ?? [])[0]?.id ?? '',
    });
    setError(null);
  };

  const handleOpenEditEntry = (entry: Entry) => {
    setEditingType('entry');
    setEditingId(entry.id);
    setFormOpen(true);
    setUnifiedForm({
      ...emptyUnifiedForm(),
      direction: entry.direction,
      schedule: 'date',
      amount: entry.amount,
      date: entry.date,
      categoryId: entry.categoryId,
      note: entry.note ?? '',
    });
    setError(null);
  };

  const handleOpenEditRecurringExpense = (p: RecurringExpensePayment) => {
    setEditingType('recurringExpense');
    setEditingId(p.id);
    setFormOpen(true);
    const r = p.recurrence;
    setUnifiedForm({
      ...emptyUnifiedForm(),
      direction: 'expense',
      schedule: r.kind === 'date' ? 'date' : 'interval',
      amount: p.amountPerOccurrence,
      categoryId: p.categoryId,
      note: p.note ?? '',
      date: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
      unit: r.kind === 'interval' ? r.unit : 'month',
      interval: r.kind === 'interval' ? r.interval : 1,
      anchorDate: r.kind === 'interval' ? r.anchorDate.slice(0, 10) : todayISO(),
      endDate: r.kind === 'interval' && r.endDate ? r.endDate.slice(0, 10) : '',
      repeatCount: p.repeatCount != null ? String(p.repeatCount) : '',
      recurrenceDate: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
    });
    setError(null);
  };

  const handleOpenEditRecurringIncome = (p: RecurringIncome) => {
    setEditingType('recurringIncome');
    setEditingId(p.id);
    setFormOpen(true);
    const r = p.recurrence;
    setUnifiedForm({
      ...emptyUnifiedForm(),
      direction: 'income',
      schedule: r.kind === 'date' ? 'date' : 'interval',
      amount: p.amountPerOccurrence,
      categoryId: p.categoryId,
      note: p.note ?? '',
      date: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
      unit: r.kind === 'interval' ? r.unit : 'month',
      interval: r.kind === 'interval' ? r.interval : 1,
      anchorDate: r.kind === 'interval' ? r.anchorDate.slice(0, 10) : todayISO(),
      endDate: r.kind === 'interval' && r.endDate ? r.endDate.slice(0, 10) : '',
      repeatCount: p.repeatCount != null ? String(p.repeatCount) : '',
      recurrenceDate: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
    });
    setError(null);
  };

  const handleCancelForm = () => {
    setFormOpen(false);
    setEditingType(null);
    setEditingId(null);
    setUnifiedForm(emptyUnifiedForm());
    setError(null);
  };

  const handleUnifiedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const f = unifiedForm;
    if (f.amount <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }
    if (editingType && editingId) {
      if (editingType === 'entry') {
        if (!f.categoryId.trim()) {
          setError('Выберите категорию');
          return;
        }
        updateEntryMutation.mutate({ id: editingId, data: formToEntryUpdate(f) });
        return;
      }
      if (editingType === 'recurringExpense') {
        if (!f.categoryId.trim()) {
          setError('Выберите категорию');
          return;
        }
        updateRecurringExpenseMutation.mutate({
          id: editingId,
          data: formToRecurringExpenseUpdate(f),
        });
        return;
      }
      if (editingType === 'recurringIncome') {
        if (!f.categoryId.trim()) {
          setError('Выберите категорию');
          return;
        }
        updateRecurringIncomeMutation.mutate({
          id: editingId,
          data: formToRecurringIncomeUpdate(f),
        });
        return;
      }
    }
    // Create
    if (f.schedule === 'date') {
      if (!f.categoryId.trim()) {
        setError('Выберите категорию');
        return;
      }
      const entryData = formToEntryCreate(f);
      if (entryData) createEntryMutation.mutate(entryData);
      return;
    }
    if (f.direction === 'expense') {
      if (!f.categoryId.trim()) {
        setError('Выберите категорию');
        return;
      }
      const recExp = formToRecurringExpenseCreate(f);
      if (recExp) createRecurringExpenseMutation.mutate(recExp);
      return;
    }
    if (!f.categoryId.trim()) {
      setError('Выберите категорию');
      return;
    }
    const recInc = formToRecurringIncomeCreate(f);
    if (recInc) createRecurringIncomeMutation.mutate(recInc);
  };

  const showForm = formOpen || editingType !== null;
  const entriesLoading = entriesQuery.isPending;
  const entriesListError = entriesQuery.error
    ? entriesQuery.error instanceof Error
      ? entriesQuery.error.message
      : 'Не удалось загрузить записи'
    : null;
  const isFormPending =
    createEntryMutation.isPending ||
    updateEntryMutation.isPending ||
    createRecurringExpenseMutation.isPending ||
    updateRecurringExpenseMutation.isPending ||
    createRecurringIncomeMutation.isPending ||
    updateRecurringIncomeMutation.isPending;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Платежи и поступления</h1>
        <Link to="/" className={styles.backLink}>
          На главную
        </Link>
      </header>

      <section className={styles.formSection}>
        {!showForm ? (
          <div className={styles.addButtonRow}>
            <button
              type="button"
              onClick={handleOpenCreate}
              className={styles.addButton}
            >
              Добавить запись
            </button>
          </div>
        ) : null}
        {showForm ? (
          <form onSubmit={handleUnifiedSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>
              {editingType ? 'Редактировать запись' : 'Новая запись'}
            </h2>
            <div className={styles.field}>
              <span className={styles.label}>Тип</span>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="unified-direction"
                    checked={unifiedForm.direction === 'income'}
                    onChange={() =>
                      setUnifiedForm(prev => ({ ...prev, direction: 'income', categoryId: '' }))
                    }
                    disabled={!!editingType}
                  />
                  Доход
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="unified-direction"
                    checked={unifiedForm.direction === 'expense'}
                    onChange={() =>
                      setUnifiedForm(prev => ({ ...prev, direction: 'expense', categoryId: '' }))
                    }
                    disabled={!!editingType}
                  />
                  Расход
                </label>
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Повторение</span>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="unified-schedule"
                    checked={unifiedForm.schedule === 'date'}
                    onChange={() =>
                      setUnifiedForm(prev => ({ ...prev, schedule: 'date' }))
                    }
                    disabled={!!editingType}
                  />
                  Одна дата
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="unified-schedule"
                    checked={unifiedForm.schedule === 'interval'}
                    onChange={() =>
                      setUnifiedForm(prev => ({ ...prev, schedule: 'interval' }))
                    }
                    disabled={!!editingType}
                  />
                  По интервалу
                </label>
              </div>
            </div>
            {unifiedForm.schedule === 'date' ? (
              <div className={styles.field}>
                <label htmlFor="unified-date" className={styles.label}>
                  Дата
                </label>
                <input
                  id="unified-date"
                  type="date"
                  value={unifiedForm.date}
                  onChange={e =>
                    setUnifiedForm(prev => ({ ...prev, date: e.target.value }))
                  }
                  className={styles.input}
                />
              </div>
            ) : null}
            <div className={styles.field}>
              <label htmlFor="unified-amount" className={styles.label}>
                Сумма
                {unifiedForm.schedule !== 'date' ? ' за одно вхождение' : ''}
              </label>
              <input
                id="unified-amount"
                type="number"
                min={0}
                step={0.01}
                value={unifiedForm.amount || ''}
                onChange={e =>
                  setUnifiedForm(prev => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0"
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="unified-category" className={styles.label}>
                Категория
              </label>
              <select
                id="unified-category"
                className={styles.select}
                value={unifiedForm.categoryId}
                onChange={e =>
                  setUnifiedForm(prev => ({ ...prev, categoryId: e.target.value }))
                }
              >
                <option value="">— Выберите категорию —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>
            {unifiedForm.schedule === 'interval' ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="unified-unit" className={styles.label}>
                    Единица
                  </label>
                  <select
                    id="unified-unit"
                    className={styles.select}
                    value={unifiedForm.unit}
                    onChange={e =>
                      setUnifiedForm(prev => ({
                        ...prev,
                        unit: e.target.value as UnifiedFormState['unit'],
                      }))
                    }
                  >
                    <option value="day">День</option>
                    <option value="week">Неделя</option>
                    <option value="month">Месяц</option>
                    <option value="year">Год</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="unified-interval" className={styles.label}>
                    Каждые (число)
                  </label>
                  <input
                    id="unified-interval"
                    type="number"
                    min={1}
                    value={unifiedForm.interval}
                    onChange={e =>
                      setUnifiedForm(prev => ({
                        ...prev,
                        interval: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="unified-anchorDate" className={styles.label}>
                    Дата начала
                  </label>
                  <input
                    id="unified-anchorDate"
                    type="date"
                    value={unifiedForm.anchorDate}
                    onChange={e =>
                      setUnifiedForm(prev => ({
                        ...prev,
                        anchorDate: e.target.value,
                      }))
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="unified-endDate" className={styles.label}>
                    Дата окончания (необязательно)
                  </label>
                  <input
                    id="unified-endDate"
                    type="date"
                    value={unifiedForm.endDate}
                    onChange={e =>
                      setUnifiedForm(prev => ({ ...prev, endDate: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="unified-repeatCount" className={styles.label}>
                    Количество повторов (пусто = бесконечно)
                  </label>
                  <input
                    id="unified-repeatCount"
                    type="number"
                    min={0}
                    value={unifiedForm.repeatCount}
                    onChange={e =>
                      setUnifiedForm(prev => ({
                        ...prev,
                        repeatCount: e.target.value,
                      }))
                    }
                    className={styles.input}
                    placeholder="Пусто — без ограничения"
                  />
                </div>
              </>
            ) : null}
            <div className={styles.field}>
              <label htmlFor="unified-note" className={styles.label}>
                Примечание (опционально)
              </label>
              <input
                id="unified-note"
                type="text"
                value={unifiedForm.note}
                onChange={e =>
                  setUnifiedForm(prev => ({ ...prev, note: e.target.value }))
                }
                className={styles.input}
              />
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={isFormPending}
                className={styles.submitButton}
              >
                {editingType ? 'Сохранить' : 'Добавить'}
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className={styles.cancelButton}
              >
                Отмена
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className={styles.listSection}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Записи</h2>
          <select
            className={styles.filterSelect}
            value={entryFilter}
            onChange={e =>
              setEntryFilter(e.target.value as EntryFilterType)
            }
            aria-label="Фильтр по типу"
          >
            <option value="all">Все</option>
            <option value="income">Доходы</option>
            <option value="expense">Расходы</option>
          </select>
        </div>
        {entriesLoading && <p className={styles.status}>Загрузка...</p>}
        {entriesListError && (
          <p className={styles.error}>{entriesListError}</p>
        )}
        {!entriesLoading && !entriesListError && entries.length === 0 ? (
          <p className={styles.empty}>Записей пока нет. Добавьте первую.</p>
        ) : null}
        {!entriesLoading && !entriesListError && entries.length > 0 ? (
          <ul className={styles.list}>
            {entries.map(entry => {
              const cat = categoryMap.get(entry.categoryId);
              return (
                <li key={entry.id} className={styles.card}>
                  {cat ? (
                    <span
                      className={styles.colorSwatch}
                      style={{
                        backgroundColor: cat.color || '#6b7280',
                      }}
                      aria-hidden
                    />
                  ) : null}
                  <div className={styles.cardMain}>
                    <span
                      className={
                        entry.direction === 'income'
                          ? styles.badgeIncome
                          : styles.badgeExpense
                      }
                    >
                      {entry.direction === 'income' ? 'Доход' : 'Расход'}
                    </span>
                    <span className={styles.cardDate}>
                      {formatDate(entry.date)}
                    </span>
                    <span className={styles.cardAmount}>
                      {entry.direction === 'income' ? '+' : '−'}
                      {entry.amount.toLocaleString('ru-RU')} ₽
                    </span>
                    {cat ? (
                      <span>
                        {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                      </span>
                    ) : null}
                    {entry.note ? (
                      <span className={styles.cardNote}>{entry.note}</span>
                    ) : null}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditEntry(entry)}
                      className={styles.iconButton}
                      title="Редактировать"
                      aria-label="Редактировать"
                    >
                      ✎
                    </button>
                    {entryDeleteConfirmId === entry.id ? (
                      <>
                        <span className={styles.confirmText}>Удалить?</span>
                        <button
                          type="button"
                          onClick={() =>
                            deleteEntryMutation.mutate(entry.id)
                          }
                          disabled={deleteEntryMutation.isPending}
                          className={styles.dangerButton}
                        >
                          Да
                        </button>
                        <button
                          type="button"
                          onClick={() => setEntryDeleteConfirmId(null)}
                          className={styles.cancelButton}
                        >
                          Нет
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEntryDeleteConfirmId(entry.id)}
                        className={styles.iconButton}
                        title="Удалить"
                        aria-label="Удалить"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className={styles.recurringSection}>
        <h2 className={styles.listTitle}>Повторяющиеся платежи</h2>
        {recurringExpenseQuery.isPending && (
          <p className={styles.status}>Загрузка...</p>
        )}
        {recurringExpenseQuery.error && (
          <p className={styles.error}>
            {recurringExpenseQuery.error instanceof Error
              ? recurringExpenseQuery.error.message
              : 'Не удалось загрузить'}
          </p>
        )}
        {!recurringExpenseQuery.isPending &&
        !recurringExpenseQuery.error &&
        recurringExpenseList.length === 0 ? (
          <p className={styles.empty}>Повторяющихся платежей нет.</p>
        ) : null}
        {!recurringExpenseQuery.isPending &&
        !recurringExpenseQuery.error &&
        recurringExpenseList.length > 0 ? (
          <ul className={styles.list}>
            {recurringExpenseList.map(p => {
              const cat = categoryMap.get(p.categoryId);
              return (
                <li key={p.id} className={styles.card}>
                  {cat ? (
                    <span
                      className={styles.colorSwatch}
                      style={{
                        backgroundColor: cat.color || '#6b7280',
                      }}
                      aria-hidden
                    />
                  ) : null}
                  <div className={styles.cardMain}>
                    <span className={styles.kindBadge}>Повторяющийся</span>
                    <span className={styles.cardAmount}>
                      {p.amountPerOccurrence.toLocaleString('ru-RU')} ₽
                    </span>
                    <span className={styles.cardRecurrence}>
                      {describeRecurrence(p.recurrence)}
                    </span>
                    {cat ? (
                      <span>
                        {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                      </span>
                    ) : null}
                    {p.note ? (
                      <span className={styles.cardNote}>{p.note}</span>
                    ) : null}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditRecurringExpense(p)}
                      className={styles.iconButton}
                      title="Редактировать"
                      aria-label="Редактировать"
                    >
                      ✎
                    </button>
                    {recurringExpenseDeleteId === p.id ? (
                      <>
                        <span className={styles.confirmText}>Удалить?</span>
                        <button
                          type="button"
                          onClick={() =>
                            deleteRecurringExpenseMutation.mutate(p.id)
                          }
                          disabled={deleteRecurringExpenseMutation.isPending}
                          className={styles.dangerButton}
                        >
                          Да
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecurringExpenseDeleteId(null)}
                          className={styles.cancelButton}
                        >
                          Нет
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRecurringExpenseDeleteId(p.id)}
                        className={styles.iconButton}
                        title="Удалить"
                        aria-label="Удалить"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className={styles.recurringSection}>
        <h2 className={styles.listTitle}>Повторяющиеся поступления</h2>
        {recurringIncomeQuery.isPending && (
          <p className={styles.status}>Загрузка...</p>
        )}
        {recurringIncomeQuery.error && (
          <p className={styles.error}>
            {recurringIncomeQuery.error instanceof Error
              ? recurringIncomeQuery.error.message
              : 'Не удалось загрузить'}
          </p>
        )}
        {!recurringIncomeQuery.isPending &&
        !recurringIncomeQuery.error &&
        recurringIncomeList.length === 0 ? (
          <p className={styles.empty}>Повторяющихся поступлений нет.</p>
        ) : null}
        {!recurringIncomeQuery.isPending &&
        !recurringIncomeQuery.error &&
        recurringIncomeList.length > 0 ? (
          <ul className={styles.list}>
            {recurringIncomeList.map(p => {
              const cat = categoryMap.get(p.categoryId);
              return (
                <li key={p.id} className={styles.card}>
                  <div className={styles.cardMain}>
                    <span className={styles.badgeIncome}>Доход</span>
                    <span className={styles.kindBadge}>Повторяющийся</span>
                    <span className={styles.cardAmount}>
                      +{p.amountPerOccurrence.toLocaleString('ru-RU')} ₽
                    </span>
                    <span className={styles.cardRecurrence}>
                      {describeRecurrence(p.recurrence)}
                    </span>
                    {cat ? (
                      <span>
                        {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                      </span>
                    ) : null}
                  {p.note ? (
                    <span className={styles.cardNote}>{p.note}</span>
                  ) : null}
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => handleOpenEditRecurringIncome(p)}
                    className={styles.iconButton}
                    title="Редактировать"
                    aria-label="Редактировать"
                  >
                    ✎
                  </button>
                  {recurringIncomeDeleteId === p.id ? (
                    <>
                      <span className={styles.confirmText}>Удалить?</span>
                      <button
                        type="button"
                        onClick={() =>
                          deleteRecurringIncomeMutation.mutate(p.id)
                        }
                        disabled={deleteRecurringIncomeMutation.isPending}
                        className={styles.dangerButton}
                      >
                        Да
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecurringIncomeDeleteId(null)}
                        className={styles.cancelButton}
                      >
                        Нет
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRecurringIncomeDeleteId(p.id)}
                      className={styles.iconButton}
                      title="Удалить"
                      aria-label="Удалить"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
