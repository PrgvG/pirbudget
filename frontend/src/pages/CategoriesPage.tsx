import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Alert,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconPencil,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
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
import { ResponsiveModal } from '../components/ResponsiveModal';
import { CategoryForm } from './CategoryForm';
import styles from './CategoriesPage.module.css';

const CATEGORIES_QUERY_KEY = ['categories'] as const;

const DEFAULT_CATEGORY_COLOR = '#6b7280';

const getRandomCategoryColor = (): string => {
  const palette: string[] = [
    '#f97316',
    '#22c55e',
    '#0ea5e9',
    '#6366f1',
    '#ec4899',
    '#eab308',
  ];
  const index = Math.floor(Math.random() * palette.length);
  return palette[index] ?? DEFAULT_CATEGORY_COLOR;
};

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
  color: getRandomCategoryColor(),
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
    onError: err => setError(formatApiError(err)),
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
    onError: err => setError(formatApiError(err)),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      setDeleteConfirmId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
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
      <Title order={2} mb="lg">
        Категории
      </Title>

      <SegmentedControl
        value={direction}
        onChange={val => handleDirectionChange(val as CategoryDirection)}
        data={[
          { label: 'Расходы', value: 'expense' },
          { label: 'Доходы', value: 'income' },
        ]}
        fullWidth
        mb="md"
      />

      {!editingId && (
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleStartCreate}
          mb="md"
        >
          Добавить категорию
        </Button>
      )}

      <section>
        <Title order={4} mb="sm">
          {direction === 'expense' ? 'Категории расходов' : 'Категории доходов'}
        </Title>

        {loading && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
        {listError && (
          <Alert color="red" mb="sm">
            {listError}
          </Alert>
        )}
        {!loading && !listError && categories.length === 0 && (
          <Text c="dimmed" ta="center" py="md">
            Категорий пока нет. Добавьте первую.
          </Text>
        )}
        {!loading && !listError && categories.length > 0 && (
          <Stack component="ul" className={styles.list} gap="xs">
            {categories.map(c => (
              <Card
                key={c.id}
                component="li"
                withBorder
                radius="md"
                padding="sm"
              >
                <Group align="center" gap="sm" wrap="nowrap">
                  <span
                    className={styles.colorSwatch}
                    style={
                      {
                        '--swatch-color': c.color || undefined,
                      } as React.CSSProperties
                    }
                    aria-hidden
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" align="center">
                      {c.icon && <span>{c.icon}</span>}
                      <Text component="span" fw={500}>
                        {c.name}
                      </Text>
                      <Badge
                        size="xs"
                        radius="sm"
                        color={c.direction === 'expense' ? 'red' : 'green'}
                      >
                        {c.direction === 'expense' ? 'Расход' : 'Доход'}
                      </Badge>
                    </Group>
                  </div>
                  <Text component="span" size="sm" c="dimmed">
                    {c.sortOrder}
                  </Text>
                  <Group gap={4} wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      aria-label="Поднять"
                      onClick={() => handleMove(c, 'up')}
                      disabled={
                        reorderMutation.isPending ||
                        categoriesQuery.data?.findIndex(x => x.id === c.id) ===
                          0
                      }
                    >
                      <IconArrowUp size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      aria-label="Опустить"
                      onClick={() => handleMove(c, 'down')}
                      disabled={
                        reorderMutation.isPending ||
                        categoriesQuery.data?.findIndex(x => x.id === c.id) ===
                          categories.length - 1
                      }
                    >
                      <IconArrowDown size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      aria-label="Редактировать"
                      onClick={() => handleStartEdit(c)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    {deleteConfirmId === c.id ? (
                      <Group gap={4} wrap="nowrap">
                        <Text component="span" size="xs" c="dimmed">
                          В архив?
                        </Text>
                        <Button
                          size="compact-xs"
                          color="red"
                          onClick={() => deleteMutation.mutate(c.id)}
                          loading={deleteMutation.isPending}
                        >
                          Да
                        </Button>
                        <Button
                          size="compact-xs"
                          variant="default"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Нет
                        </Button>
                      </Group>
                    ) : (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label="В архив"
                        onClick={() => setDeleteConfirmId(c.id)}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </section>

      <ResponsiveModal
        isOpen={Boolean(editingId || createMode)}
        onClose={handleCancelEdit}
        title={editingId ? 'Редактировать категорию' : 'Новая категория'}
      >
        <CategoryForm
          value={form}
          onChange={next => setForm(next)}
          mode={editingId ? 'edit' : 'create'}
          error={error}
          isPending={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={handleCancelEdit}
        />
      </ResponsiveModal>
    </div>
  );
}
