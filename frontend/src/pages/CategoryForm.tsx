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
import { ModalLayout } from '../components/ModalLayout';

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
      <ModalLayout
        footer={
          <Group gap="sm" mt="xs" w="100%">
            <Button type="submit" loading={isPending} style={{ flex: 1 }}>
              {mode === 'edit' ? 'Сохранить' : 'Добавить'}
            </Button>
            {mode === 'edit' && (
              <Button
                type="button"
                variant="default"
                onClick={onCancel}
                style={{ flex: 1 }}
              >
                Отмена
              </Button>
            )}
          </Group>
        }
      >
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
            hideControls
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
        </Stack>
      </ModalLayout>
    </form>
  );
}
