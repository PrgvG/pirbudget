import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type {
  IncomeEntry,
  IncomeEntryCreate,
  IncomeEntryUpdate,
} from 'shared/transactions';
import {
  fetchIncomeEntries,
  createIncomeEntry,
  updateIncomeEntry,
  deleteIncomeEntry,
} from '../domains/income-entries';
import styles from './IncomesPage.module.css';

const INCOME_ENTRIES_QUERY_KEY = ['income-entries'] as const;

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate + 'T00:00:00').toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  date: string;
  amount: number;
  source: string;
  note: string;
};

const emptyForm: FormState = {
  date: todayISO(),
  amount: 0,
  source: '',
  note: '',
};

function formToCreate(f: FormState): IncomeEntryCreate {
  return {
    direction: 'income',
    amount: f.amount,
    date: f.date.trim(),
    source: f.source.trim(),
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function formToUpdate(f: FormState): IncomeEntryUpdate {
  const u: IncomeEntryUpdate = {};
  if (f.amount !== undefined && f.amount !== null) u.amount = f.amount;
  if (f.date.trim()) u.date = f.date.trim();
  if (f.source.trim()) u.source = f.source.trim();
  u.note = f.note.trim() || undefined;
  return u;
}

export function IncomesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const entriesQuery = useQuery({
    queryKey: INCOME_ENTRIES_QUERY_KEY,
    queryFn: fetchIncomeEntries,
  });

  const createMutation = useMutation({
    mutationFn: createIncomeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_ENTRIES_QUERY_KEY });
      setForm({ ...emptyForm, date: todayISO() });
      setCreateMode(false);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: IncomeEntryUpdate }) =>
      updateIncomeEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_ENTRIES_QUERY_KEY });
      setEditingId(null);
      setForm(emptyForm);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIncomeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_ENTRIES_QUERY_KEY });
      setDeleteConfirmId(null);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    },
  });

  const handleStartCreate = () => {
    setEditingId(null);
    setCreateMode(true);
    setForm({ ...emptyForm, date: todayISO() });
    setError(null);
  };

  const handleStartEdit = (entry: IncomeEntry) => {
    setEditingId(entry.id);
    setCreateMode(false);
    setForm({
      date: entry.date,
      amount: entry.amount,
      source: entry.source,
      note: entry.note ?? '',
    });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCreateMode(false);
    setForm({ ...emptyForm, date: todayISO() });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.source.trim()) {
      setError('Укажите источник');
      return;
    }
    if (form.amount <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formToUpdate(form) });
    } else {
      createMutation.mutate(formToCreate(form));
    }
  };

  const entries = entriesQuery.data ?? [];
  const loading = entriesQuery.isPending;
  const listError = entriesQuery.error
    ? entriesQuery.error instanceof Error
      ? entriesQuery.error.message
      : 'Не удалось загрузить поступления'
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Поступления</h1>
        <Link to="/" className={styles.backLink}>
          На главную
        </Link>
      </header>

      <section className={styles.formSection}>
        {!editingId ? (
          <button
            type="button"
            onClick={handleStartCreate}
            className={styles.addButton}
          >
            Добавить поступление
          </button>
        ) : null}
        {editingId || createMode ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>
              {editingId ? 'Редактировать поступление' : 'Новое поступление'}
            </h2>
            <div className={styles.field}>
              <label htmlFor="income-date" className={styles.label}>
                Дата
              </label>
              <input
                id="income-date"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="income-amount" className={styles.label}>
                Сумма
              </label>
              <input
                id="income-amount"
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
                placeholder="0"
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="income-source" className={styles.label}>
                Источник
              </label>
              <input
                id="income-source"
                type="text"
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                placeholder="Например: Зарплата"
                className={styles.input}
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="income-note" className={styles.label}>
                Примечание (опционально)
              </label>
              <input
                id="income-note"
                type="text"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder=""
                className={styles.input}
              />
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
                className={styles.submitButton}
              >
                {editingId ? 'Сохранить' : 'Добавить'}
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
        <h2 className={styles.listTitle}>Список поступлений</h2>
        {loading && <p className={styles.status}>Загрузка...</p>}
        {listError && <p className={styles.error}>{listError}</p>}
        {!loading && !listError && entries.length === 0 ? (
          <p className={styles.empty}>
            Поступлений пока нет. Добавьте первое.
          </p>
        ) : null}
        {!loading && !listError && entries.length > 0 ? (
          <ul className={styles.list}>
            {entries.map(entry => (
              <li key={entry.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <span className={styles.cardDate}>
                    {formatDate(entry.date)}
                  </span>
                  <span className={styles.cardAmount}>
                    {entry.amount.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className={styles.cardSource}>{entry.source}</span>
                  {entry.note ? (
                    <span className={styles.cardNote}>{entry.note}</span>
                  ) : null}
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(entry)}
                    className={styles.iconButton}
                    title="Редактировать"
                    aria-label="Редактировать"
                  >
                    ✎
                  </button>
                  {deleteConfirmId === entry.id ? (
                    <>
                      <span className={styles.confirmText}>Удалить?</span>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(entry.id)}
                        disabled={deleteMutation.isPending}
                        className={styles.dangerButton}
                      >
                        Да
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className={styles.cancelButton}
                      >
                        Нет
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(entry.id)}
                      className={styles.iconButton}
                      title="Удалить"
                      aria-label="Удалить"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
