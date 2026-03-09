import type { CategoryDirection } from 'shared/categories';
import styles from './CategoriesPage.module.css';

type CategoryFormState = {
  name: string;
  sortOrder: number;
  color: string;
  icon: string;
  direction: CategoryDirection;
};

type CategoryFormProps = {
  value: CategoryFormState;
  onChange: (next: CategoryFormState) => void;
  mode: 'create' | 'edit';
  error: string | null;
  isPending: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
};

export function CategoryForm({
  value,
  onChange,
  mode,
  error,
  isPending,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, name: event.target.value });
  };

  const handleSortOrderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextSortOrder = parseInt(event.target.value, 10) || 0;
    onChange({ ...value, sortOrder: nextSortOrder });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, color: event.target.value });
  };

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, icon: event.target.value });
  };

  const isExpenseDirection = value.direction === 'expense';

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <h2 className={styles.formTitle}>
        {mode === 'edit' ? 'Редактировать категорию' : 'Новая категория'}
      </h2>
      <div className={styles.field}>
        <label htmlFor="category-name" className={styles.label}>
          Название
        </label>
        <input
          id="category-name"
          type="text"
          value={value.name}
          onChange={handleNameChange}
          placeholder={isExpenseDirection ? 'Например: Продукты' : 'Например: Зарплата'}
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
          value={value.sortOrder}
          onChange={handleSortOrderChange}
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
            value={value.color}
            onChange={handleColorChange}
            className={styles.colorInput}
          />
          <input
            type="text"
            value={value.color}
            onChange={handleColorChange}
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
          value={value.icon}
          onChange={handleIconChange}
          placeholder="Эмодзи или код"
          className={styles.input}
        />
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.formActions}>
        <button
          type="submit"
          disabled={isPending}
          className={styles.submitButton}
        >
          {mode === 'edit' ? 'Сохранить' : 'Добавить'}
        </button>
        {mode === 'edit' ? (
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Отмена
          </button>
        ) : null}
      </div>
    </form>
  );
}

