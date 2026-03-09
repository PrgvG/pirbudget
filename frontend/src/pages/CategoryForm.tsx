import type { CategoryDirection } from 'shared/categories';
import {
  Alert,
  Button,
  ColorInput,
  Group,
  NumberInput,
  Stack,
  TextInput,
} from '@mantine/core';

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
  const isExpenseDirection = value.direction === 'expense';

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="sm">
        <TextInput
          label="Название"
          value={value.name}
          onChange={e =>
            onChange({ ...value, name: e.currentTarget.value })
          }
          placeholder={
            isExpenseDirection
              ? 'Например: Продукты'
              : 'Например: Зарплата'
          }
          autoFocus
        />

        <NumberInput
          label="Порядок"
          min={0}
          value={value.sortOrder}
          onChange={next => {
            const nextSortOrder =
              typeof next === 'number'
                ? next
                : parseInt(String(next ?? ''), 10) || 0;
            onChange({ ...value, sortOrder: nextSortOrder });
          }}
        />

        <ColorInput
          label="Цвет"
          format="hex"
          value={value.color}
          onChange={next => onChange({ ...value, color: next })}
        />

        <TextInput
          label="Иконка (опционально)"
          value={value.icon}
          onChange={e =>
            onChange({ ...value, icon: e.currentTarget.value })
          }
          placeholder="Эмодзи или код"
        />

        {error && (
          <Alert color="red" title="Ошибка">
            {error}
          </Alert>
        )}

        <Group gap="sm" mt="xs">
          <Button type="submit" loading={isPending}>
            {mode === 'edit' ? 'Сохранить' : 'Добавить'}
          </Button>
          {mode === 'edit' && (
            <Button type="button" variant="default" onClick={onCancel}>
              Отмена
            </Button>
          )}
        </Group>
      </Stack>
    </form>
  );
}
