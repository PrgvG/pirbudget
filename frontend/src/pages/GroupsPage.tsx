import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type {
  PaymentGroup,
  PaymentGroupCreate,
  PaymentGroupUpdate,
} from 'shared/payment-groups';
import {
  fetchPaymentGroups,
  createPaymentGroup,
  updatePaymentGroup,
  deletePaymentGroup,
} from '../domains/payment-groups';
import styles from './GroupsPage.module.css';

const PAYMENT_GROUPS_QUERY_KEY = ['payment-groups'] as const;

type FormState = {
  name: string;
  sortOrder: number;
  color: string;
  icon: string;
};

const emptyForm: FormState = {
  name: '',
  sortOrder: 0,
  color: '',
  icon: '',
};

function formToCreate(f: FormState): PaymentGroupCreate {
  return {
    name: f.name.trim(),
    sortOrder: f.sortOrder,
    ...(f.color.trim() && { color: f.color.trim() }),
    ...(f.icon.trim() && { icon: f.icon.trim() }),
  };
}

function formToUpdate(f: FormState): PaymentGroupUpdate {
  const u: PaymentGroupUpdate = {
    sortOrder: f.sortOrder,
  };
  if (f.name.trim()) u.name = f.name.trim();
  if (f.color.trim()) u.color = f.color.trim();
  else u.color = undefined;
  if (f.icon.trim()) u.icon = f.icon.trim();
  else u.icon = undefined;
  return u;
}

export function GroupsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupsQuery = useQuery({
    queryKey: PAYMENT_GROUPS_QUERY_KEY,
    queryFn: fetchPaymentGroups,
  });

  const createMutation = useMutation({
    mutationFn: createPaymentGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_GROUPS_QUERY_KEY });
      setForm(emptyForm);
      setCreateMode(false);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentGroupUpdate }) =>
      updatePaymentGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_GROUPS_QUERY_KEY });
      setEditingId(null);
      setForm(emptyForm);
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentGroupUpdate }) =>
      updatePaymentGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_GROUPS_QUERY_KEY });
      setError(null);
    },
    onError: err => {
      setError(err instanceof Error ? err.message : 'Ошибка смены порядка');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_GROUPS_QUERY_KEY });
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
    setForm({ ...emptyForm, sortOrder: groupsQuery.data?.length ?? 0 });
    setError(null);
  };

  const handleStartEdit = (g: PaymentGroup) => {
    setEditingId(g.id);
    setCreateMode(false);
    setForm({
      name: g.name,
      sortOrder: g.sortOrder,
      color: g.color ?? '',
      icon: g.icon ?? '',
    });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCreateMode(false);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Введите название');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formToUpdate(form) });
    } else {
      createMutation.mutate(formToCreate(form));
    }
  };

  const handleMove = (group: PaymentGroup, direction: 'up' | 'down') => {
    const list = groupsQuery.data ?? [];
    const idx = list.findIndex(x => x.id === group.id);
    if (idx < 0) return;
    const other = direction === 'up' ? list[idx - 1] : list[idx + 1];
    if (!other) return;
    reorderMutation.mutate({
      id: group.id,
      data: { sortOrder: other.sortOrder },
    });
    reorderMutation.mutate({
      id: other.id,
      data: { sortOrder: group.sortOrder },
    });
  };

  const groups = groupsQuery.data ?? [];
  const loading = groupsQuery.isPending;
  const listError = groupsQuery.error
    ? groupsQuery.error instanceof Error
      ? groupsQuery.error.message
      : 'Не удалось загрузить группы'
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Группы платежей</h1>
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
            Добавить группу
          </button>
        ) : null}
        {editingId || createMode ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>
              {editingId ? 'Редактировать группу' : 'Новая группа'}
            </h2>
            <div className={styles.field}>
              <label htmlFor="group-name" className={styles.label}>
                Название
              </label>
              <input
                id="group-name"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Например: Продукты"
                className={styles.input}
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="group-sortOrder" className={styles.label}>
                Порядок
              </label>
              <input
                id="group-sortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    sortOrder: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="group-color" className={styles.label}>
                Цвет
              </label>
              <div className={styles.colorRow}>
                <input
                  id="group-color"
                  type="color"
                  value={form.color || '#6b7280'}
                  onChange={e =>
                    setForm(f => ({ ...f, color: e.target.value }))
                  }
                  className={styles.colorInput}
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={e =>
                    setForm(f => ({ ...f, color: e.target.value }))
                  }
                  placeholder="#hex или название"
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="group-icon" className={styles.label}>
                Иконка (опционально)
              </label>
              <input
                id="group-icon"
                type="text"
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="Эмодзи или код"
                className={styles.input}
              />
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className={styles.submitButton}
              >
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={styles.cancelButton}
                >
                  Отмена
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>

      <section className={styles.listSection}>
        <h2 className={styles.listTitle}>Список групп</h2>
        {loading && <p className={styles.status}>Загрузка...</p>}
        {listError && <p className={styles.error}>{listError}</p>}
        {!loading && !listError && groups.length === 0 ? (
          <p className={styles.empty}>Групп пока нет. Добавьте первую.</p>
        ) : null}
        {!loading && !listError && groups.length > 0 ? (
          <ul className={styles.list}>
            {groups.map(g => (
              <li key={g.id} className={styles.card}>
                <span
                  className={styles.colorSwatch}
                  style={{ backgroundColor: g.color || '#6b7280' }}
                  aria-hidden
                />
                <span className={styles.cardName}>
                  {g.icon ? (
                    <span className={styles.cardIcon}>{g.icon}</span>
                  ) : null}
                  {g.name}
                </span>
                <span className={styles.cardOrder}>{g.sortOrder}</span>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => handleMove(g, 'up')}
                    disabled={
                      reorderMutation.isPending ||
                      groupsQuery.data?.findIndex(x => x.id === g.id) === 0
                    }
                    className={styles.iconButton}
                    title="Выше"
                    aria-label="Поднять"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(g, 'down')}
                    disabled={
                      reorderMutation.isPending ||
                      groupsQuery.data?.findIndex(x => x.id === g.id) ===
                        groups.length - 1
                    }
                    className={styles.iconButton}
                    title="Ниже"
                    aria-label="Опустить"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(g)}
                    className={styles.iconButton}
                    title="Редактировать"
                    aria-label="Редактировать"
                  >
                    ✎
                  </button>
                  {deleteConfirmId === g.id ? (
                    <>
                      <span className={styles.confirmText}>В архив?</span>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(g.id)}
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
                      onClick={() => setDeleteConfirmId(g.id)}
                      className={styles.iconButton}
                      title="В архив"
                      aria-label="В архив"
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
