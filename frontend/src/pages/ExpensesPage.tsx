import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { PaymentGroup } from 'shared/payment-groups';
import type {
  InstantExpensePayment,
  RecurringExpensePayment,
  InstantExpensePaymentCreate,
  InstantExpensePaymentUpdate,
  RecurringExpensePaymentCreate,
  RecurringExpensePaymentUpdate,
} from 'shared/expenses';
import type { RecurrenceByInterval, RecurrenceByDate } from 'shared/recurrence';
import { fetchPaymentGroups } from '../domains/payment-groups';
import {
  fetchInstantExpenses,
  fetchRecurringExpenses,
  createInstantExpense,
  updateInstantExpense,
  deleteInstantExpense,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from '../domains/expenses';
import styles from './ExpensesPage.module.css';

const GROUPS_QUERY_KEY = ['payment-groups'] as const;
const INSTANT_EXPENSES_QUERY_KEY = ['expenses', 'instant'] as const;
const RECURRING_EXPENSES_QUERY_KEY = ['expenses', 'recurring'] as const;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

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

function describeRecurrence(
  r: RecurrenceByInterval | RecurrenceByDate
): string {
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
  const every =
    r.interval === 1 ? `каждый ${u}` : `каждые ${r.interval} ${u}`;
  return `${every} с ${formatDate(r.anchorDate)}`;
}

type FormState = {
  kind: 'instant' | 'recurring';
  groupId: string;
  amount: number;
  date: string;
  note: string;
  // recurring
  recurrenceKind: 'interval' | 'date';
  unit: 'day' | 'week' | 'month' | 'year';
  interval: number;
  anchorDate: string;
  endDate: string;
  repeatCount: string;
  recurrenceDate: string;
};

const emptyForm: FormState = {
  kind: 'instant',
  groupId: '',
  amount: 0,
  date: todayISO(),
  note: '',
  recurrenceKind: 'interval',
  unit: 'month',
  interval: 1,
  anchorDate: todayISO(),
  endDate: '',
  repeatCount: '',
  recurrenceDate: todayISO(),
};

function formToInstantCreate(
  f: FormState,
  _groups: PaymentGroup[]
): InstantExpensePaymentCreate | null {
  if (!f.groupId.trim()) return null;
  return {
    kind: 'instant',
    groupId: f.groupId.trim(),
    amount: f.amount,
    date: f.date.trim().length <= 10 ? f.date.trim() + 'T00:00:00.000Z' : f.date.trim(),
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function formToInstantUpdate(f: FormState): InstantExpensePaymentUpdate {
  const u: InstantExpensePaymentUpdate = {};
  if (f.groupId.trim()) u.groupId = f.groupId.trim();
  if (f.amount !== undefined) u.amount = f.amount;
  if (f.date.trim()) u.date = f.date.trim().length <= 10 ? f.date.trim() + 'T00:00:00.000Z' : f.date.trim();
  u.note = f.note.trim() || undefined;
  return u;
}

function formToRecurringCreate(
  f: FormState,
  _groups: PaymentGroup[]
): RecurringExpensePaymentCreate | null {
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
  const repeatCount =
    f.repeatCount.trim() === ''
      ? null
      : parseInt(f.repeatCount, 10);
  const validRepeat =
    repeatCount === null || (Number.isInteger(repeatCount) && repeatCount >= 0);
  return {
    kind: 'recurring',
    groupId: f.groupId.trim(),
    amountPerOccurrence: f.amount,
    recurrence,
    repeatCount: validRepeat ? repeatCount : null,
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function formToRecurringUpdate(f: FormState): RecurringExpensePaymentUpdate {
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
  const repeatCount =
    f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  const u: RecurringExpensePaymentUpdate = {
    groupId: f.groupId.trim(),
    amountPerOccurrence: f.amount,
    recurrence,
    repeatCount:
      repeatCount === null || (Number.isInteger(repeatCount) && repeatCount >= 0)
        ? repeatCount
        : undefined,
    note: f.note.trim() || undefined,
  };
  return u;
}

type Editing = { kind: 'instant'; id: string } | { kind: 'recurring'; id: string };
type DeleteConfirm = { kind: 'instant'; id: string } | { kind: 'recurring'; id: string } | null;

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);
  const [error, setError] = useState<string | null>(null);

  const groupsQuery = useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: fetchPaymentGroups,
  });
  const instantQuery = useQuery({
    queryKey: INSTANT_EXPENSES_QUERY_KEY,
    queryFn: fetchInstantExpenses,
  });
  const recurringQuery = useQuery({
    queryKey: RECURRING_EXPENSES_QUERY_KEY,
    queryFn: fetchRecurringExpenses,
  });

  const groups = groupsQuery.data ?? [];
  const instantList = instantQuery.data ?? [];
  const recurringList = recurringQuery.data ?? [];

  const createInstantMutation = useMutation({
    mutationFn: createInstantExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANT_EXPENSES_QUERY_KEY });
      setForm(emptyForm);
      setCreateMode(false);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    },
  });

  const updateInstantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InstantExpensePaymentUpdate }) =>
      updateInstantExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANT_EXPENSES_QUERY_KEY });
      setEditing(null);
      setForm(emptyForm);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    },
  });

  const deleteInstantMutation = useMutation({
    mutationFn: deleteInstantExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANT_EXPENSES_QUERY_KEY });
      setDeleteConfirm(null);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    },
  });

  const createRecurringMutation = useMutation({
    mutationFn: createRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSES_QUERY_KEY });
      setForm(emptyForm);
      setCreateMode(false);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: { id: string; data: RecurringExpensePaymentUpdate }) =>
      updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSES_QUERY_KEY });
      setEditing(null);
      setForm(emptyForm);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSES_QUERY_KEY });
      setDeleteConfirm(null);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    },
  });

  const handleStartCreate = () => {
    setEditing(null);
    setCreateMode(true);
    setForm({
      ...emptyForm,
      date: todayISO(),
      anchorDate: todayISO(),
      recurrenceDate: todayISO(),
      groupId: groups[0]?.id ?? '',
    });
    setError(null);
  };

  const handleStartEditInstant = (p: InstantExpensePayment) => {
    setEditing({ kind: 'instant', id: p.id });
    setCreateMode(false);
    setForm({
      ...emptyForm,
      kind: 'instant',
      groupId: p.groupId,
      amount: p.amount,
      date: p.date.slice(0, 10),
      note: p.note ?? '',
    });
    setError(null);
  };

  const handleStartEditRecurring = (p: RecurringExpensePayment) => {
    setEditing({ kind: 'recurring', id: p.id });
    setCreateMode(false);
    const r = p.recurrence;
    const recurrenceKind = r.kind === 'date' ? 'date' : 'interval';
    setForm({
      ...emptyForm,
      kind: 'recurring',
      groupId: p.groupId,
      amount: p.amountPerOccurrence,
      note: p.note ?? '',
      recurrenceKind,
      unit: r.kind === 'interval' ? r.unit : 'month',
      interval: r.kind === 'interval' ? r.interval : 1,
      anchorDate: r.kind === 'interval' ? r.anchorDate.slice(0, 10) : todayISO(),
      endDate: r.kind === 'interval' && r.endDate ? r.endDate.slice(0, 10) : '',
      repeatCount: p.repeatCount != null ? String(p.repeatCount) : '',
      recurrenceDate: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
    });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setCreateMode(false);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.groupId.trim()) {
      setError('Выберите группу');
      return;
    }
    if (form.kind === 'instant') {
      if (form.amount <= 0) {
        setError('Сумма должна быть больше нуля');
        return;
      }
      if (editing?.kind === 'instant') {
        updateInstantMutation.mutate({
          id: editing.id,
          data: formToInstantUpdate(form),
        });
      } else {
        const data = formToInstantCreate(form, groups);
        if (data) createInstantMutation.mutate(data);
        else setError('Заполните поля');
      }
    } else {
      if (form.amount <= 0) {
        setError('Сумма должна быть больше нуля');
        return;
      }
      if (editing?.kind === 'recurring') {
        updateRecurringMutation.mutate({
          id: editing.id,
          data: formToRecurringUpdate(form),
        });
      } else {
        const data = formToRecurringCreate(form, groups);
        if (data) createRecurringMutation.mutate(data);
        else setError('Заполните поля');
      }
    }
  };

  const showForm = createMode || editing !== null;
  const listError =
    instantQuery.error || recurringQuery.error
      ? (instantQuery.error instanceof Error
          ? instantQuery.error.message
          : recurringQuery.error instanceof Error
            ? recurringQuery.error.message
            : 'Не удалось загрузить платежи')
      : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Обязательные платежи</h1>
        <Link to="/" className={styles.backLink}>
          На главную
        </Link>
      </header>

      <section className={styles.formSection}>
        {!editing ? (
          <button
            type="button"
            onClick={handleStartCreate}
            className={styles.addButton}
          >
            Добавить платеж
          </button>
        ) : null}
        {showForm ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>
              {editing ? 'Редактировать платеж' : 'Новый платеж'}
            </h2>

            <div className={styles.field}>
              <label htmlFor="expense-group" className={styles.label}>
                Группа
              </label>
              <select
                id="expense-group"
                className={styles.select}
                value={form.groupId}
                onChange={e =>
                  setForm(f => ({ ...f, groupId: e.target.value }))
                }
                required
              >
                <option value="">— Выберите группу —</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.icon ? `${g.icon} ` : ''}
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {!editing ? (
              <div className={styles.field}>
                <span className={styles.label}>Тип</span>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="kind"
                      checked={form.kind === 'instant'}
                      onChange={() =>
                        setForm(f => ({ ...f, kind: 'instant' }))
                      }
                    />
                    Разовый
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="kind"
                      checked={form.kind === 'recurring'}
                      onChange={() =>
                        setForm(f => ({ ...f, kind: 'recurring' }))
                      }
                    />
                    Повторяющийся
                  </label>
                </div>
              </div>
            ) : null}

            {form.kind === 'instant' ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="expense-amount" className={styles.label}>
                    Сумма
                  </label>
                  <input
                    id="expense-amount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.amount || ''}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="expense-date" className={styles.label}>
                    Дата
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    value={form.date}
                    onChange={e =>
                      setForm(f => ({ ...f, date: e.target.value }))
                    }
                    className={styles.input}
                  />
                </div>
              </>
            ) : (
              <>
                <div className={styles.field}>
                  <label
                    htmlFor="expense-amount-recurring"
                    className={styles.label}
                  >
                    Сумма за одно вхождение
                  </label>
                  <input
                    id="expense-amount-recurring"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.amount || ''}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Повторение</span>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="recurrenceKind"
                        checked={form.recurrenceKind === 'interval'}
                        onChange={() =>
                          setForm(f => ({
                            ...f,
                            recurrenceKind: 'interval',
                          }))
                        }
                      />
                      По интервалу
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="recurrenceKind"
                        checked={form.recurrenceKind === 'date'}
                        onChange={() =>
                          setForm(f => ({
                            ...f,
                            recurrenceKind: 'date',
                          }))
                        }
                      />
                      Одна дата
                    </label>
                  </div>
                </div>
                {form.recurrenceKind === 'interval' ? (
                  <>
                    <div className={styles.field}>
                      <label
                        htmlFor="expense-unit"
                        className={styles.label}
                      >
                        Единица
                      </label>
                      <select
                        id="expense-unit"
                        className={styles.select}
                        value={form.unit}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            unit: e.target
                              .value as FormState['unit'],
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
                      <label
                        htmlFor="expense-interval"
                        className={styles.label}
                      >
                        Каждые (число)
                      </label>
                      <input
                        id="expense-interval"
                        type="number"
                        min={1}
                        value={form.interval}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            interval: parseInt(e.target.value, 10) || 1,
                          }))
                        }
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.field}>
                      <label
                        htmlFor="expense-anchorDate"
                        className={styles.label}
                      >
                        Дата начала
                      </label>
                      <input
                        id="expense-anchorDate"
                        type="date"
                        value={form.anchorDate}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            anchorDate: e.target.value,
                          }))
                        }
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.field}>
                      <label
                        htmlFor="expense-endDate"
                        className={styles.label}
                      >
                        Дата окончания (необязательно)
                      </label>
                      <input
                        id="expense-endDate"
                        type="date"
                        value={form.endDate}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            endDate: e.target.value,
                          }))
                        }
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.field}>
                      <label
                        htmlFor="expense-repeatCount"
                        className={styles.label}
                      >
                        Количество повторов (пусто = бесконечно)
                      </label>
                      <input
                        id="expense-repeatCount"
                        type="number"
                        min={0}
                        value={form.repeatCount}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            repeatCount: e.target.value,
                          }))
                        }
                        className={styles.input}
                        placeholder="Пусто — без ограничения"
                      />
                    </div>
                  </>
                ) : (
                  <div className={styles.field}>
                    <label
                      htmlFor="expense-recurrenceDate"
                      className={styles.label}
                    >
                      Дата платежа
                    </label>
                    <input
                      id="expense-recurrenceDate"
                      type="date"
                      value={form.recurrenceDate}
                      onChange={e =>
                        setForm(f => ({
                          ...f,
                          recurrenceDate: e.target.value,
                        }))
                      }
                      className={styles.input}
                    />
                  </div>
                )}
              </>
            )}

            <div className={styles.field}>
              <label htmlFor="expense-note" className={styles.label}>
                Примечание (необязательно)
              </label>
              <input
                id="expense-note"
                type="text"
                value={form.note}
                onChange={e =>
                  setForm(f => ({ ...f, note: e.target.value }))
                }
                className={styles.input}
                placeholder=""
              />
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}
            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={
                  createInstantMutation.isPending ||
                  updateInstantMutation.isPending ||
                  createRecurringMutation.isPending ||
                  updateRecurringMutation.isPending
                }
                className={styles.submitButton}
              >
                {editing ? 'Сохранить' : 'Добавить'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className={styles.cancelButton}
              >
                Отмена
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className={styles.listSection}>
        <h2 className={styles.listTitle}>Список платежей</h2>
        {(instantQuery.isPending || recurringQuery.isPending) && (
          <p className={styles.status}>Загрузка...</p>
        )}
        {listError && <p className={styles.error}>{listError}</p>}

        {!instantQuery.isPending && !recurringQuery.isPending && !listError && (
          <>
            <h3 className={styles.subListTitle}>Разовые</h3>
            {instantList.length === 0 ? (
              <p className={styles.empty}>Разовых платежей нет.</p>
            ) : (
              <ul className={styles.list}>
                {instantList.map(p => {
                  const group = groups.find(g => g.id === p.groupId);
                  return (
                    <li key={p.id} className={styles.card}>
                      {group ? (
                        <span
                          className={styles.colorSwatch}
                          style={{
                            backgroundColor: group.color || '#6b7280',
                          }}
                          aria-hidden
                        />
                      ) : null}
                      <div className={styles.cardMain}>
                        <span className={styles.kindBadge}>Разовый</span>
                        <span className={styles.cardAmount}>
                          {p.amount.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className={styles.cardDate}>
                          {formatDate(p.date)}
                        </span>
                        {group ? (
                          <span>{group.icon ? `${group.icon} ` : ''}{group.name}</span>
                        ) : null}
                        {p.note ? (
                          <span className={styles.cardNote}>{p.note}</span>
                        ) : null}
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          onClick={() => handleStartEditInstant(p)}
                          className={styles.iconButton}
                          title="Редактировать"
                          aria-label="Редактировать"
                        >
                          ✎
                        </button>
                        {deleteConfirm?.kind === 'instant' &&
                        deleteConfirm?.id === p.id ? (
                          <>
                            <span className={styles.confirmText}>Удалить?</span>
                            <button
                              type="button"
                              onClick={() =>
                                deleteInstantMutation.mutate(p.id)
                              }
                              disabled={deleteInstantMutation.isPending}
                              className={styles.dangerButton}
                            >
                              Да
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(null)}
                              className={styles.cancelButton}
                            >
                              Нет
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({ kind: 'instant', id: p.id })
                            }
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
            )}

            <h3 className={styles.subListTitle}>Повторяющиеся</h3>
            {recurringList.length === 0 ? (
              <p className={styles.empty}>Повторяющихся платежей нет.</p>
            ) : (
              <ul className={styles.list}>
                {recurringList.map(p => {
                  const group = groups.find(g => g.id === p.groupId);
                  return (
                    <li key={p.id} className={styles.card}>
                      {group ? (
                        <span
                          className={styles.colorSwatch}
                          style={{
                            backgroundColor: group.color || '#6b7280',
                          }}
                          aria-hidden
                        />
                      ) : null}
                      <div className={styles.cardMain}>
                        <span className={styles.kindBadge}>
                          Повторяющийся
                        </span>
                        <span className={styles.cardAmount}>
                          {p.amountPerOccurrence.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className={styles.cardRecurrence}>
                          {describeRecurrence(p.recurrence)}
                        </span>
                        {group ? (
                          <span>{group.icon ? `${group.icon} ` : ''}{group.name}</span>
                        ) : null}
                        {p.note ? (
                          <span className={styles.cardNote}>{p.note}</span>
                        ) : null}
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          onClick={() => handleStartEditRecurring(p)}
                          className={styles.iconButton}
                          title="Редактировать"
                          aria-label="Редактировать"
                        >
                          ✎
                        </button>
                        {deleteConfirm?.kind === 'recurring' &&
                        deleteConfirm?.id === p.id ? (
                          <>
                            <span className={styles.confirmText}>Удалить?</span>
                            <button
                              type="button"
                              onClick={() =>
                                deleteRecurringMutation.mutate(p.id)
                              }
                              disabled={deleteRecurringMutation.isPending}
                              className={styles.dangerButton}
                            >
                              Да
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(null)}
                              className={styles.cancelButton}
                            >
                              Нет
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                kind: 'recurring',
                                id: p.id,
                              })
                            }
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
            )}
          </>
        )}
      </section>
    </div>
  );
}
