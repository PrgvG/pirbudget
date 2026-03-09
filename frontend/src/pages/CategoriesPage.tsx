import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryDirection,
} from 'shared/categories';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../domains/categories';
import { formatApiError } from '../api/formatError';
import styles from './CategoriesPage.module.css';

const CATEGORIES_QUERY_KEY = ['categories'] as const;

type FormState = {
  name: string;
  sortOrder: number;
  color: string;
  icon: string;
  direction: CategoryDirection;
};

const emptyForm = (direction: CategoryDirection): FormState => ({
  name: '',
  sortOrder: 0,
  color: '',
  icon: '',
  direction,
});

function formToCreate(f: FormState): CategoryCreate {
  return {
    name: f.name.trim(),
    sortOrder: f.sortOrder,
    direction: f.direction,
    ...(f.color.trim() && { color: f.color.trim() }),
    ...(f.icon.trim() && { icon: f.icon.trim() }),
  };
}

function formToUpdate(f: FormState): CategoryUpdate {
  const u: CategoryUpdate = {
    sortOrder: f.sortOrder,
  };
  if (f.name.trim()) u.name = f.name.trim();
  if (f.color.trim()) u.color = f.color.trim();
  else u.color = undefined;
  if (f.icon.trim()) u.icon = f.icon.trim();
  else u.icon = undefined;
  return u;
}

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [direction, setDirection] = useState<CategoryDirection>('expense');
  const [form, setForm] = useState<FormState>(emptyForm('expense'));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, direction],
    queryFn: () => fetchCategories(direction),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      setForm(emptyForm(direction));
      setCreateMode(false);
      setError(null);
    },
    onError: err => {
      setError(formatApiError(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      setEditingId(null);
      setForm(emptyForm(direction));
      setError(null);
    },
    onError: err => {
      setError(formatApiError(err));
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      setError(null);
    },
    onError: err => {
      setError(formatApiError(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      setDeleteConfirmId(null);
      setError(null);
    },
    onError: err => {
      setError(formatApiError(err));
    },
  });

  const handleDirectionChange = (d: CategoryDirection) => {
    setDirection(d);
    setEditingId(null);
    setCreateMode(false);
    setForm(emptyForm(d));
    setError(null);
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setCreateMode(true);
    setForm({
      ...emptyForm(direction),
      sortOrder: categoriesQuery.data?.length ?? 0,
    });
    setError(null);
  };

  const handleStartEdit = (c: Category) => {
    setEditingId(c.id);
    setCreateMode(false);
    setForm({
      name: c.name,
      sortOrder: c.sortOrder,
      color: c.color ?? '',
      icon: c.icon ?? '',
      direction: c.direction,
    });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCreateMode(false);
    setForm(emptyForm(direction));
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

  const handleMove = (category: Category, moveDirection: 'up' | 'down') => {
    const list = categoriesQuery.data ?? [];
    const idx = list.findIndex(x => x.id === category.id);
    if (idx < 0) return;
    const other = moveDirection === 'up' ? list[idx - 1] : list[idx + 1];
    if (!other) return;
    reorderMutation.mutate({
      id: category.id,
      data: { sortOrder: other.sortOrder },
    });
    reorderMutation.mutate({
      id: other.id,
      data: { sortOrder: category.sortOrder },
    });
  };

  const categories = categoriesQuery.data ?? [];
  const loading = categoriesQuery.isPending;
  const listError = categoriesQuery.error
    ? categoriesQuery.error instanceof Error
      ? categoriesQuery.error.message
      : 'Не удалось загрузить категории'
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Категории</h1>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={direction === 'expense' ? styles.tabActive : styles.tab}
          onClick={() => handleDirectionChange('expense')}
        >
          Расходы
        </button>
        <button
          type="button"
          className={direction === 'income' ? styles.tabActive : styles.tab}
          onClick={() => handleDirectionChange('income')}
        >
          Доходы
        </button>
      </div>

      <section className={styles.formSection}>
        {!editingId ? (
          <button
            type="button"
            onClick={handleStartCreate}
            className={styles.addButton}
          >
            Добавить категорию
          </button>
        ) : null}
        {editingId || createMode ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>
              {editingId ? 'Редактировать категорию' : 'Новая категория'}
            </h2>
            <div className={styles.field}>
              <label htmlFor="category-name" className={styles.label}>
                Название
              </label>
              <input
                id="category-name"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={
                  direction === 'expense' ? 'Например: Продукты' : 'Например: Зарплата'
                }
                className={styles.input}
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="category-sortOrder" className={styles.label}>
                Порядок
              </label>
              <input
                id="category-sortOrder"
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
              <label htmlFor="category-color" className={styles.label}>
                Цвет
              </label>
              <div className={styles.colorRow}>
                <input
                  id="category-color"
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
              <label htmlFor="category-icon" className={styles.label}>
                Иконка (опционально)
              </label>
              <input
                id="category-icon"
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
        <h2 className={styles.listTitle}>
          {direction === 'expense' ? 'Категории расходов' : 'Категории доходов'}
        </h2>
        {loading && <p className={styles.status}>Загрузка...</p>}
        {listError && <p className={styles.error}>{listError}</p>}
        {!loading && !listError && categories.length === 0 ? (
          <p className={styles.empty}>
            Категорий пока нет. Добавьте первую.
          </p>
        ) : null}
        {!loading && !listError && categories.length > 0 ? (
          <ul className={styles.list}>
            {categories.map(c => (
              <li key={c.id} className={styles.card}>
                <span
                  className={styles.colorSwatch}
                  style={{ backgroundColor: c.color || '#6b7280' }}
                  aria-hidden
                />
                <span className={styles.cardName}>
                  {c.icon ? (
                    <span className={styles.cardIcon}>{c.icon}</span>
                  ) : null}
                  {c.name}
                </span>
                <span className={styles.cardOrder}>{c.sortOrder}</span>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => handleMove(c, 'up')}
                    disabled={
                      reorderMutation.isPending ||
                      categoriesQuery.data?.findIndex(x => x.id === c.id) === 0
                    }
                    className={styles.iconButton}
                    title="Выше"
                    aria-label="Поднять"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(c, 'down')}
                    disabled={
                      reorderMutation.isPending ||
                      categoriesQuery.data?.findIndex(x => x.id === c.id) ===
                        categories.length - 1
                    }
                    className={styles.iconButton}
                    title="Ниже"
                    aria-label="Опустить"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(c)}
                    className={styles.iconButton}
                    title="Редактировать"
                    aria-label="Редактировать"
                  >
                    ✎
                  </button>
                  {deleteConfirmId === c.id ? (
                    <>
                      <span className={styles.confirmText}>В архив?</span>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(c.id)}
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
                      onClick={() => setDeleteConfirmId(c.id)}
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
