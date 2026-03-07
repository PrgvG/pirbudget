import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { Entry, EntryCreate, EntryUpdate } from 'shared/entries';
import type { PaymentGroup } from 'shared/payment-groups';
import type { RecurringExpensePayment } from 'shared/expenses';
import type { RecurrenceByInterval, RecurrenceByDate } from 'shared/recurrence';
import { fetchPaymentGroups } from '../domains/payment-groups';
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
import { formatApiError } from '../api/formatError';
import styles from './TransactionsPage.module.css';

const ENTRIES_QUERY_KEY = ['entries'] as const;
const GROUPS_QUERY_KEY = ['payment-groups'] as const;
const RECURRING_QUERY_KEY = ['expenses', 'recurring'] as const;

type EntryFilterType = 'all' | 'income' | 'expense';

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

// --- Entry form (income / expense) ---
type EntryFormState = {
  direction: 'income' | 'expense';
  date: string;
  amount: number;
  source: string;
  groupId: string;
  note: string;
};

const emptyEntryForm: EntryFormState = {
  direction: 'income',
  date: todayISO(),
  amount: 0,
  source: '',
  groupId: '',
  note: '',
};

function entryFormToCreate(f: EntryFormState, _groups: PaymentGroup[]): EntryCreate | null {
  if (f.direction === 'income') {
    if (!f.source.trim()) return null;
    return {
      direction: 'income',
      amount: f.amount,
      date: f.date.trim(),
      source: f.source.trim(),
      ...(f.note.trim() && { note: f.note.trim() }),
    };
  }
  if (!f.groupId.trim()) return null;
  return {
    direction: 'expense',
    amount: f.amount,
    date: f.date.trim(),
    groupId: f.groupId.trim(),
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function entryFormToUpdate(f: EntryFormState): EntryUpdate {
  const u: EntryUpdate = {};
  if (f.amount !== undefined) u.amount = f.amount;
  if (f.date.trim()) u.date = f.date.trim();
  if (f.direction === 'income') {
    if (f.source.trim()) u.source = f.source.trim();
  } else {
    if (f.groupId.trim()) u.groupId = f.groupId.trim();
  }
  u.note = f.note.trim() || undefined;
  return u;
}

// --- Recurring form (from ExpensesPage) ---
type RecurringFormState = {
  groupId: string;
  amount: number;
  note: string;
  recurrenceKind: 'interval' | 'date';
  unit: 'day' | 'week' | 'month' | 'year';
  interval: number;
  anchorDate: string;
  endDate: string;
  repeatCount: string;
  recurrenceDate: string;
};

const emptyRecurringForm: RecurringFormState = {
  groupId: '',
  amount: 0,
  note: '',
  recurrenceKind: 'interval',
  unit: 'month',
  interval: 1,
  anchorDate: todayISO(),
  endDate: '',
  repeatCount: '',
  recurrenceDate: todayISO(),
};

function recurringFormToCreate(
  f: RecurringFormState
): Parameters<typeof createRecurringExpense>[0] | null {
  if (!f.groupId.trim()) return null;
  const recurrence: RecurrenceByInterval | RecurrenceByDate =
    f.recurrenceKind === 'date'
      ? { kind: 'date', date: f.recurrenceDate.trim().length <= 10 ? f.recurrenceDate.trim() + 'T00:00:00.000Z' : f.recurrenceDate.trim() }
      : {
          kind: 'interval',
          unit: f.unit,
          interval: f.interval,
          anchorDate: f.anchorDate.trim().length <= 10 ? f.anchorDate.trim() + 'T00:00:00.000Z' : f.anchorDate.trim(),
          ...(f.endDate.trim() && { endDate: f.endDate.trim().length <= 10 ? f.endDate.trim() + 'T00:00:00.000Z' : f.endDate.trim() }),
        };
  const repeatCount = f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  const validRepeat = repeatCount === null || (Number.isInteger(repeatCount) && repeatCount >= 0);
  return {
    kind: 'recurring',
    groupId: f.groupId.trim(),
    amountPerOccurrence: f.amount,
    recurrence,
    repeatCount: validRepeat ? repeatCount : null,
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function recurringFormToUpdate(f: RecurringFormState): Parameters<typeof updateRecurringExpense>[1] {
  const recurrence: RecurrenceByInterval | RecurrenceByDate =
    f.recurrenceKind === 'date'
      ? { kind: 'date', date: f.recurrenceDate.trim().length <= 10 ? f.recurrenceDate.trim() + 'T00:00:00.000Z' : f.recurrenceDate.trim() }
      : {
          kind: 'interval',
          unit: f.unit,
          interval: f.interval,
          anchorDate: f.anchorDate.trim().length <= 10 ? f.anchorDate.trim() + 'T00:00:00.000Z' : f.anchorDate.trim(),
          ...(f.endDate.trim() && { endDate: f.endDate.trim().length <= 10 ? f.endDate.trim() + 'T00:00:00.000Z' : f.endDate.trim() }),
        };
  const repeatCount = f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  return {
    groupId: f.groupId.trim(),
    amountPerOccurrence: f.amount,
    recurrence,
    repeatCount: repeatCount === null || (Number.isInteger(repeatCount) && repeatCount >= 0) ? repeatCount : undefined,
    note: f.note.trim() || undefined,
  };
}

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [entryFilter, setEntryFilter] = useState<EntryFilterType>('all');
  const [entryForm, setEntryForm] = useState<EntryFormState>(emptyEntryForm);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryCreateMode, setEntryCreateMode] = useState(false);
  const [entryDeleteConfirmId, setEntryDeleteConfirmId] = useState<string | null>(null);
  const [recurringForm, setRecurringForm] = useState<RecurringFormState>(emptyRecurringForm);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);
  const [recurringCreateMode, setRecurringCreateMode] = useState(false);
  const [recurringDeleteConfirmId, setRecurringDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupsQuery = useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: fetchPaymentGroups,
  });
  const entriesQuery = useQuery({
    queryKey: [...ENTRIES_QUERY_KEY, entryFilter],
    queryFn: () => fetchEntries({ type: entryFilter === 'all' ? undefined : entryFilter }),
  });
  const recurringQuery = useQuery({
    queryKey: RECURRING_QUERY_KEY,
    queryFn: fetchRecurringExpenses,
  });

  const groups = groupsQuery.data ?? [];
  const entries = entriesQuery.data ?? [];
  const recurringList = recurringQuery.data ?? [];

  const createEntryMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setEntryForm({ ...emptyEntryForm, date: todayISO() });
      setEntryCreateMode(false);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntryUpdate }) => updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setEditingEntryId(null);
      setEntryForm(emptyEntryForm);
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

  const createRecurringMutation = useMutation({
    mutationFn: createRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      setRecurringForm(emptyRecurringForm);
      setRecurringCreateMode(false);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const updateRecurringMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateRecurringExpense>[1] }) =>
      updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      setEditingRecurringId(null);
      setRecurringForm(emptyRecurringForm);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY });
      setRecurringDeleteConfirmId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const handleStartEntryCreate = (direction: 'income' | 'expense') => {
    setEditingEntryId(null);
    setEntryCreateMode(true);
    setEntryForm({
      ...emptyEntryForm,
      direction,
      date: todayISO(),
      groupId: direction === 'expense' ? groups[0]?.id ?? '' : '',
    });
    setError(null);
  };

  const handleStartEntryEdit = (entry: Entry) => {
    setEditingEntryId(entry.id);
    setEntryCreateMode(false);
    setEntryForm({
      direction: entry.direction,
      date: entry.date,
      amount: entry.amount,
      source: entry.direction === 'income' ? entry.source : '',
      groupId: entry.direction === 'expense' ? entry.groupId : '',
      note: entry.note ?? '',
    });
    setError(null);
  };

  const handleCancelEntryForm = () => {
    setEditingEntryId(null);
    setEntryCreateMode(false);
    setEntryForm(emptyEntryForm);
    setError(null);
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryForm.direction === 'income' && !entryForm.source.trim()) {
      setError('Укажите источник');
      return;
    }
    if (entryForm.direction === 'expense' && !entryForm.groupId.trim()) {
      setError('Выберите группу');
      return;
    }
    if (entryForm.amount <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }
    if (editingEntryId) {
      updateEntryMutation.mutate({ id: editingEntryId, data: entryFormToUpdate(entryForm) });
    } else {
      const data = entryFormToCreate(entryForm, groups);
      if (data) createEntryMutation.mutate(data);
    }
  };

  const handleStartRecurringCreate = () => {
    setEditingRecurringId(null);
    setRecurringCreateMode(true);
    setRecurringForm({ ...emptyRecurringForm, anchorDate: todayISO(), recurrenceDate: todayISO(), groupId: groups[0]?.id ?? '' });
    setError(null);
  };

  const handleStartRecurringEdit = (p: RecurringExpensePayment) => {
    setEditingRecurringId(p.id);
    setRecurringCreateMode(false);
    const r = p.recurrence;
    setRecurringForm({
      ...emptyRecurringForm,
      groupId: p.groupId,
      amount: p.amountPerOccurrence,
      note: p.note ?? '',
      recurrenceKind: r.kind === 'date' ? 'date' : 'interval',
      unit: r.kind === 'interval' ? r.unit : 'month',
      interval: r.kind === 'interval' ? r.interval : 1,
      anchorDate: r.kind === 'interval' ? r.anchorDate.slice(0, 10) : todayISO(),
      endDate: r.kind === 'interval' && r.endDate ? r.endDate.slice(0, 10) : '',
      repeatCount: p.repeatCount != null ? String(p.repeatCount) : '',
      recurrenceDate: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
    });
    setError(null);
  };

  const handleCancelRecurringForm = () => {
    setEditingRecurringId(null);
    setRecurringCreateMode(false);
    setRecurringForm(emptyRecurringForm);
    setError(null);
  };

  const handleRecurringSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recurringForm.groupId.trim()) {
      setError('Выберите группу');
      return;
    }
    if (recurringForm.amount <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }
    if (editingRecurringId) {
      updateRecurringMutation.mutate({ id: editingRecurringId, data: recurringFormToUpdate(recurringForm) });
    } else {
      const data = recurringFormToCreate(recurringForm);
      if (data) createRecurringMutation.mutate(data);
    }
  };

  const showEntryForm = entryCreateMode || editingEntryId !== null;
  const showRecurringForm = recurringCreateMode || editingRecurringId !== null;
  const entriesLoading = entriesQuery.isPending;
  const entriesListError = entriesQuery.error
    ? entriesQuery.error instanceof Error
      ? entriesQuery.error.message
      : 'Не удалось загрузить записи'
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Платежи и поступления</h1>
        <Link to="/" className={styles.backLink}>
          На главную
        </Link>
      </header>

      <section className={styles.formSection}>
        {!editingEntryId && !editingRecurringId ? (
          <div className={styles.addButtonRow}>
            <button
              type="button"
              onClick={() => handleStartEntryCreate('income')}
              className={styles.addButton}
            >
              Добавить поступление
            </button>
            <button
              type="button"
              onClick={handleStartRecurringCreate}
              className={styles.addButton}
            >
              Добавить повторяющийся платёж
            </button>
          </div>
        ) : null}
        {showEntryForm ? (
          <form onSubmit={handleEntrySubmit} className={styles.form}>
            <h2 className={styles.formTitle}>
              {editingEntryId ? 'Редактировать запись' : 'Новая запись'}
            </h2>
            <div className={styles.field}>
              <span className={styles.label}>Тип</span>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="entry-direction"
                    checked={entryForm.direction === 'income'}
                    onChange={() => setEntryForm(f => ({ ...f, direction: 'income' }))}
                    disabled={!!editingEntryId}
                  />
                  Доход
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="entry-direction"
                    checked={entryForm.direction === 'expense'}
                    onChange={() => setEntryForm(f => ({ ...f, direction: 'expense' }))}
                    disabled={!!editingEntryId}
                  />
                  Расход
                </label>
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="entry-date" className={styles.label}>
                Дата
              </label>
              <input
                id="entry-date"
                type="date"
                value={entryForm.date}
                onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="entry-amount" className={styles.label}>
                Сумма
              </label>
              <input
                id="entry-amount"
                type="number"
                min={0}
                step={0.01}
                value={entryForm.amount || ''}
                onChange={e => setEntryForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className={styles.input}
              />
            </div>
            {entryForm.direction === 'income' ? (
              <div className={styles.field}>
                <label htmlFor="entry-source" className={styles.label}>
                  Источник
                </label>
                <input
                  id="entry-source"
                  type="text"
                  value={entryForm.source}
                  onChange={e => setEntryForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="Например: Зарплата"
                  className={styles.input}
                />
              </div>
            ) : (
              <div className={styles.field}>
                <label htmlFor="entry-group" className={styles.label}>
                  Группа
                </label>
                <select
                  id="entry-group"
                  className={styles.select}
                  value={entryForm.groupId}
                  onChange={e => setEntryForm(f => ({ ...f, groupId: e.target.value }))}
                >
                  <option value="">— Выберите группу —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.icon ? `${g.icon} ` : ''}{g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className={styles.field}>
              <label htmlFor="entry-note" className={styles.label}>
                Примечание (опционально)
              </label>
              <input
                id="entry-note"
                type="text"
                value={entryForm.note}
                onChange={e => setEntryForm(f => ({ ...f, note: e.target.value }))}
                className={styles.input}
              />
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={createEntryMutation.isPending || updateEntryMutation.isPending}
                className={styles.submitButton}
              >
                {editingEntryId ? 'Сохранить' : 'Добавить'}
              </button>
              <button type="button" onClick={handleCancelEntryForm} className={styles.cancelButton}>
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
            onChange={e => setEntryFilter(e.target.value as EntryFilterType)}
            aria-label="Фильтр по типу"
          >
            <option value="all">Все</option>
            <option value="income">Доходы</option>
            <option value="expense">Расходы</option>
          </select>
        </div>
        {entriesLoading && <p className={styles.status}>Загрузка...</p>}
        {entriesListError && <p className={styles.error}>{entriesListError}</p>}
        {!entriesLoading && !entriesListError && entries.length === 0 ? (
          <p className={styles.empty}>Записей пока нет. Добавьте первую.</p>
        ) : null}
        {!entriesLoading && !entriesListError && entries.length > 0 ? (
          <ul className={styles.list}>
            {entries.map(entry => {
              const group = entry.direction === 'expense' ? groups.find(g => g.id === entry.groupId) : null;
              return (
                <li key={entry.id} className={styles.card}>
                  {group ? (
                    <span
                      className={styles.colorSwatch}
                      style={{ backgroundColor: group.color || '#6b7280' }}
                      aria-hidden
                    />
                  ) : null}
                  <div className={styles.cardMain}>
                    <span className={entry.direction === 'income' ? styles.badgeIncome : styles.badgeExpense}>
                      {entry.direction === 'income' ? 'Доход' : 'Расход'}
                    </span>
                    <span className={styles.cardDate}>{formatDate(entry.date)}</span>
                    <span className={styles.cardAmount}>
                      {entry.direction === 'income' ? '+' : '−'}
                      {entry.amount.toLocaleString('ru-RU')} ₽
                    </span>
                    {entry.direction === 'income' ? (
                      <span className={styles.cardSource}>{entry.source}</span>
                    ) : group ? (
                      <span>{group.icon ? `${group.icon} ` : ''}{group.name}</span>
                    ) : null}
                    {entry.note ? <span className={styles.cardNote}>{entry.note}</span> : null}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => handleStartEntryEdit(entry)}
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
                          onClick={() => deleteEntryMutation.mutate(entry.id)}
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
        {showRecurringForm ? (
          <form onSubmit={handleRecurringSubmit} className={styles.form}>
            <h3 className={styles.formTitle}>
              {editingRecurringId ? 'Редактировать' : 'Новый повторяющийся платёж'}
            </h3>
            <div className={styles.field}>
              <label htmlFor="rec-group" className={styles.label}>
                Группа
              </label>
              <select
                id="rec-group"
                className={styles.select}
                value={recurringForm.groupId}
                onChange={e => setRecurringForm(f => ({ ...f, groupId: e.target.value }))}
              >
                <option value="">— Выберите группу —</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.icon ? `${g.icon} ` : ''}{g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="rec-amount" className={styles.label}>
                Сумма за одно вхождение
              </label>
              <input
                id="rec-amount"
                type="number"
                min={0}
                step={0.01}
                value={recurringForm.amount || ''}
                onChange={e => setRecurringForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Повторение</span>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="rec-kind"
                    checked={recurringForm.recurrenceKind === 'interval'}
                    onChange={() => setRecurringForm(f => ({ ...f, recurrenceKind: 'interval' }))}
                  />
                  По интервалу
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="rec-kind"
                    checked={recurringForm.recurrenceKind === 'date'}
                    onChange={() => setRecurringForm(f => ({ ...f, recurrenceKind: 'date' }))}
                  />
                  Одна дата
                </label>
              </div>
            </div>
            {recurringForm.recurrenceKind === 'interval' ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="rec-unit" className={styles.label}>
                    Единица
                  </label>
                  <select
                    id="rec-unit"
                    className={styles.select}
                    value={recurringForm.unit}
                    onChange={e => setRecurringForm(f => ({ ...f, unit: e.target.value as RecurringFormState['unit'] }))}
                  >
                    <option value="day">День</option>
                    <option value="week">Неделя</option>
                    <option value="month">Месяц</option>
                    <option value="year">Год</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="rec-interval" className={styles.label}>
                    Каждые (число)
                  </label>
                  <input
                    id="rec-interval"
                    type="number"
                    min={1}
                    value={recurringForm.interval}
                    onChange={e => setRecurringForm(f => ({ ...f, interval: parseInt(e.target.value, 10) || 1 }))}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="rec-anchorDate" className={styles.label}>
                    Дата начала
                  </label>
                  <input
                    id="rec-anchorDate"
                    type="date"
                    value={recurringForm.anchorDate}
                    onChange={e => setRecurringForm(f => ({ ...f, anchorDate: e.target.value }))}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="rec-endDate" className={styles.label}>
                    Дата окончания (необязательно)
                  </label>
                  <input
                    id="rec-endDate"
                    type="date"
                    value={recurringForm.endDate}
                    onChange={e => setRecurringForm(f => ({ ...f, endDate: e.target.value }))}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="rec-repeatCount" className={styles.label}>
                    Количество повторов (пусто = бесконечно)
                  </label>
                  <input
                    id="rec-repeatCount"
                    type="number"
                    min={0}
                    value={recurringForm.repeatCount}
                    onChange={e => setRecurringForm(f => ({ ...f, repeatCount: e.target.value }))}
                    className={styles.input}
                    placeholder="Пусто — без ограничения"
                  />
                </div>
              </>
            ) : (
              <div className={styles.field}>
                <label htmlFor="rec-recurrenceDate" className={styles.label}>
                  Дата платежа
                </label>
                <input
                  id="rec-recurrenceDate"
                  type="date"
                  value={recurringForm.recurrenceDate}
                  onChange={e => setRecurringForm(f => ({ ...f, recurrenceDate: e.target.value }))}
                  className={styles.input}
                />
              </div>
            )}
            <div className={styles.field}>
              <label htmlFor="rec-note" className={styles.label}>
                Примечание (необязательно)
              </label>
              <input
                id="rec-note"
                type="text"
                value={recurringForm.note}
                onChange={e => setRecurringForm(f => ({ ...f, note: e.target.value }))}
                className={styles.input}
              />
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={createRecurringMutation.isPending || updateRecurringMutation.isPending}
                className={styles.submitButton}
              >
                {editingRecurringId ? 'Сохранить' : 'Добавить'}
              </button>
              <button type="button" onClick={handleCancelRecurringForm} className={styles.cancelButton}>
                Отмена
              </button>
            </div>
          </form>
        ) : null}
        {recurringQuery.isPending && <p className={styles.status}>Загрузка...</p>}
        {recurringQuery.error && (
          <p className={styles.error}>
            {recurringQuery.error instanceof Error ? recurringQuery.error.message : 'Не удалось загрузить'}
          </p>
        )}
        {!recurringQuery.isPending && !recurringQuery.error && recurringList.length === 0 ? (
          <p className={styles.empty}>Повторяющихся платежей нет.</p>
        ) : null}
        {!recurringQuery.isPending && !recurringQuery.error && recurringList.length > 0 ? (
          <ul className={styles.list}>
            {recurringList.map(p => {
              const group = groups.find(g => g.id === p.groupId);
              return (
                <li key={p.id} className={styles.card}>
                  {group ? (
                    <span
                      className={styles.colorSwatch}
                      style={{ backgroundColor: group.color || '#6b7280' }}
                      aria-hidden
                    />
                  ) : null}
                  <div className={styles.cardMain}>
                    <span className={styles.kindBadge}>Повторяющийся</span>
                    <span className={styles.cardAmount}>
                      {p.amountPerOccurrence.toLocaleString('ru-RU')} ₽
                    </span>
                    <span className={styles.cardRecurrence}>{describeRecurrence(p.recurrence)}</span>
                    {group ? (
                      <span>{group.icon ? `${group.icon} ` : ''}{group.name}</span>
                    ) : null}
                    {p.note ? <span className={styles.cardNote}>{p.note}</span> : null}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => handleStartRecurringEdit(p)}
                      className={styles.iconButton}
                      title="Редактировать"
                      aria-label="Редактировать"
                    >
                      ✎
                    </button>
                    {recurringDeleteConfirmId === p.id ? (
                      <>
                        <span className={styles.confirmText}>Удалить?</span>
                        <button
                          type="button"
                          onClick={() => deleteRecurringMutation.mutate(p.id)}
                          disabled={deleteRecurringMutation.isPending}
                          className={styles.dangerButton}
                        >
                          Да
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecurringDeleteConfirmId(null)}
                          className={styles.cancelButton}
                        >
                          Нет
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRecurringDeleteConfirmId(p.id)}
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
