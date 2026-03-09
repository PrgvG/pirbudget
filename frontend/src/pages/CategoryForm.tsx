import type { CategoryDirection } from 'shared/categories';
import { Alert, Button, ColorInput, NumberInput, TextInput } from '@mantine/core';
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

  const handleSortOrderChange = (next: string | number | null) => {
    const nextSortOrder =
      typeof next === 'number'
        ? next
        : parseInt(String(next ?? ''), 10) || 0;
    onChange({ ...value, sortOrder: nextSortOrder });
  };

  const handleColorChange = (next: string) => {
    onChange({ ...value, color: next });
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
        <TextInput
          id="category-name"
          label="Название"
          value={value.name}
          onChange={handleNameChange}
          placeholder={
            isExpenseDirection
              ? 'Например: Продукты'
              : 'Например: Зарплата'
          }
          className={styles.input}
          autoFocus
        />
      </div>
      <div className={styles.field}>
        <NumberInput
          id="category-sortOrder"
          label="Порядок"
          min={0}
          value={value.sortOrder}
          onChange={handleSortOrderChange}
          className={styles.input}
        />
      </div>
      <div className={styles.field}>
        <ColorInput
          id="category-color"
          label="Цвет"
          format="hex"
          value={value.color}
          onChange={handleColorChange}
          className={styles.input}
        />
      </div>
      <div className={styles.field}>
        <TextInput
          id="category-icon"
          label="Иконка (опционально)"
          value={value.icon}
          onChange={handleIconChange}
          placeholder="Эмодзи или код"
          className={styles.input}
        />
      </div>
      {error ? (
        <Alert color="red" title="Ошибка">
          {error}
        </Alert>
      ) : null}
      <div className={styles.formActions}>
        <Button
          type="submit"
          disabled={isPending}
          className={styles.submitButton}
        >
          {mode === 'edit' ? 'Сохранить' : 'Добавить'}
        </Button>
        {mode === 'edit' ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  );
}

