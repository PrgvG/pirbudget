import { useState, useMemo } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconPencil, IconPlus, IconX } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Entry, EntryCreate, EntryUpdate } from 'shared/entries';
import type { RecurringExpensePayment } from 'shared/expenses';
import type { RecurringIncome } from 'shared/recurring-income';
import type { RecurrenceByInterval, RecurrenceByDate } from 'shared/recurrence';
import { fetchCategories } from '../domains/categories';
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
import {
  fetchRecurringIncomes,
  createRecurringIncome,
  updateRecurringIncome,
  deleteRecurringIncome,
} from '../domains/recurring-income';
import { formatApiError } from '../api/formatError';
import { ResponsiveModal } from '../components/ResponsiveModal';
import { EntryForm } from './EntryForm';
import styles from './TransactionsPage.module.css';

const ENTRIES_QUERY_KEY = ['entries'] as const;
const CATEGORIES_QUERY_KEY = ['categories'] as const;
const RECURRING_EXPENSE_QUERY_KEY = ['expenses', 'recurring'] as const;
const RECURRING_INCOME_QUERY_KEY = ['recurring-income'] as const;

type EntryFilterType = 'all' | 'income' | 'expense';
type EditingType = 'entry' | 'recurringExpense' | 'recurringIncome' | null;

function formatDate(isoDate: string): string {
  try {
    const d = isoDate.slice(0, 10);
    const [year, month, day] = d.split('-');
    if (!year || !month || !day) return d;
    return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
  } catch {
    return isoDate.slice(0, 10);
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDateTime(dateStr: string): string {
  if (!dateStr || dateStr.length > 10) return dateStr;
  return `${dateStr}T00:00:00.000Z`;
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
  const every = r.interval === 1 ? `каждый ${u}` : `каждые ${r.interval} ${u}`;
  return `${every} с ${formatDate(r.anchorDate)}`;
}

type UnifiedFormState = {
  direction: 'income' | 'expense';
  schedule: 'date' | 'interval';
  amount: number;
  note: string;
  categoryId: string;
  date: string;
  unit: 'day' | 'week' | 'month' | 'year';
  interval: string;
  anchorDate: string;
  endDate: string;
  repeatCount: string;
  recurrenceDate: string;
};

type UnifiedFormErrors = {
  interval?: string;
};

function emptyUnifiedForm(): UnifiedFormState {
  return {
    direction: 'income',
    schedule: 'date',
    amount: 0,
    note: '',
    categoryId: '',
    date: todayISO(),
    unit: 'month',
    interval: '',
    anchorDate: todayISO(),
    endDate: '',
    repeatCount: '',
    recurrenceDate: todayISO(),
  };
}

function formToRecurrence(
  f: UnifiedFormState
): RecurrenceByInterval | RecurrenceByDate {
  if (f.schedule === 'date') {
    return { kind: 'date', date: toIsoDateTime(f.date) };
  }
  const parsedInterval = parseInt(f.interval, 10);
  return {
    kind: 'interval',
    unit: f.unit,
    interval: parsedInterval,
    anchorDate: toIsoDateTime(f.anchorDate),
    ...(f.endDate.trim() && { endDate: toIsoDateTime(f.endDate) }),
  };
}

function formToEntryCreate(f: UnifiedFormState): EntryCreate | null {
  if (!f.categoryId.trim()) return null;
  return {
    direction: f.direction,
    amount: f.amount,
    date: f.date.trim(),
    categoryId: f.categoryId.trim(),
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function formToEntryUpdate(f: UnifiedFormState): EntryUpdate {
  const u: EntryUpdate = {};
  if (f.amount !== undefined) u.amount = f.amount;
  if (f.date.trim()) u.date = f.date.trim();
  if (f.categoryId.trim()) u.categoryId = f.categoryId.trim();
  u.note = f.note.trim() || undefined;
  return u;
}

function formToRecurringExpenseCreate(
  f: UnifiedFormState
): Parameters<typeof createRecurringExpense>[0] | null {
  if (!f.categoryId.trim()) return null;
  const repeatCount =
    f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  const validRepeat =
    repeatCount === null || (Number.isInteger(repeatCount) && repeatCount >= 0);
  return {
    kind: 'recurring',
    categoryId: f.categoryId.trim(),
    amountPerOccurrence: f.amount,
    recurrence: formToRecurrence(f),
    repeatCount: validRepeat ? repeatCount : null,
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function formToRecurringExpenseUpdate(
  f: UnifiedFormState
): Parameters<typeof updateRecurringExpense>[1] {
  const repeatCount =
    f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  return {
    categoryId: f.categoryId.trim(),
    amountPerOccurrence: f.amount,
    recurrence: formToRecurrence(f),
    repeatCount:
      repeatCount === null ||
      (Number.isInteger(repeatCount) && repeatCount >= 0)
        ? repeatCount
        : undefined,
    note: f.note.trim() || undefined,
  };
}

function formToRecurringIncomeCreate(
  f: UnifiedFormState
): Parameters<typeof createRecurringIncome>[0] | null {
  if (!f.categoryId.trim()) return null;
  const repeatCount =
    f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  const validRepeat =
    repeatCount === null || (Number.isInteger(repeatCount) && repeatCount >= 0);
  return {
    categoryId: f.categoryId.trim(),
    amountPerOccurrence: f.amount,
    recurrence: formToRecurrence(f),
    repeatCount: validRepeat ? repeatCount : null,
    ...(f.note.trim() && { note: f.note.trim() }),
  };
}

function formToRecurringIncomeUpdate(
  f: UnifiedFormState
): Parameters<typeof updateRecurringIncome>[1] {
  const repeatCount =
    f.repeatCount.trim() === '' ? null : parseInt(f.repeatCount, 10);
  return {
    categoryId: f.categoryId.trim(),
    amountPerOccurrence: f.amount,
    recurrence: formToRecurrence(f),
    repeatCount:
      repeatCount === null ||
      (Number.isInteger(repeatCount) && repeatCount >= 0)
        ? repeatCount
        : undefined,
    note: f.note.trim() || undefined,
  };
}

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [entryFilter, setEntryFilter] = useState<EntryFilterType>('all');
  const [unifiedForm, setUnifiedForm] =
    useState<UnifiedFormState>(emptyUnifiedForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<EditingType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryDeleteConfirmId, setEntryDeleteConfirmId] = useState<
    string | null
  >(null);
  const [recurringExpenseDeleteId, setRecurringExpenseDeleteId] = useState<
    string | null
  >(null);
  const [recurringIncomeDeleteId, setRecurringIncomeDeleteId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<UnifiedFormErrors>({});

  const categoriesIncomeQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, 'income'],
    queryFn: () => fetchCategories('income'),
  });
  const categoriesExpenseQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, 'expense'],
    queryFn: () => fetchCategories('expense'),
  });
  const categories =
    unifiedForm.direction === 'income'
      ? (categoriesIncomeQuery.data ?? [])
      : (categoriesExpenseQuery.data ?? []);
  const categoryMap = useMemo(() => {
    const m = new Map<
      string,
      { name: string; color?: string; icon?: string }
    >();
    for (const c of categoriesIncomeQuery.data ?? []) {
      m.set(c.id, { name: c.name, color: c.color, icon: c.icon });
    }
    for (const c of categoriesExpenseQuery.data ?? []) {
      m.set(c.id, { name: c.name, color: c.color, icon: c.icon });
    }
    return m;
  }, [categoriesIncomeQuery.data, categoriesExpenseQuery.data]);
  const entriesQuery = useQuery({
    queryKey: [...ENTRIES_QUERY_KEY, entryFilter],
    queryFn: () =>
      fetchEntries({
        type: entryFilter === 'all' ? undefined : entryFilter,
      }),
  });
  const recurringExpenseQuery = useQuery({
    queryKey: RECURRING_EXPENSE_QUERY_KEY,
    queryFn: fetchRecurringExpenses,
  });
  const recurringIncomeQuery = useQuery({
    queryKey: RECURRING_INCOME_QUERY_KEY,
    queryFn: fetchRecurringIncomes,
  });

  const entries = entriesQuery.data ?? [];
  const recurringExpenseList = recurringExpenseQuery.data ?? [];
  const recurringIncomeList = recurringIncomeQuery.data ?? [];

  const createEntryMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setEditingType(null);
      setEditingId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntryUpdate }) =>
      updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setEditingType(null);
      setEditingId(null);
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
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

  const createRecurringExpenseMutation = useMutation({
    mutationFn: createRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY });
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setEditingType(null);
      setEditingId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const updateRecurringExpenseMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateRecurringExpense>[1];
    }) => updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY });
      setEditingType(null);
      setEditingId(null);
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const deleteRecurringExpenseMutation = useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSE_QUERY_KEY });
      setRecurringExpenseDeleteId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const createRecurringIncomeMutation = useMutation({
    mutationFn: createRecurringIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_INCOME_QUERY_KEY });
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setEditingType(null);
      setEditingId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const updateRecurringIncomeMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateRecurringIncome>[1];
    }) => updateRecurringIncome(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_INCOME_QUERY_KEY });
      setEditingType(null);
      setEditingId(null);
      setUnifiedForm(emptyUnifiedForm());
      setFormOpen(false);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const deleteRecurringIncomeMutation = useMutation({
    mutationFn: deleteRecurringIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_INCOME_QUERY_KEY });
      setRecurringIncomeDeleteId(null);
      setError(null);
    },
    onError: err => setError(formatApiError(err)),
  });

  const handleOpenCreate = () => {
    setEditingType(null);
    setEditingId(null);
    setFormOpen(true);
    setUnifiedForm({
      ...emptyUnifiedForm(),
      date: todayISO(),
      anchorDate: todayISO(),
      recurrenceDate: todayISO(),
      categoryId: (categoriesIncomeQuery.data ?? [])[0]?.id ?? '',
    });
    setError(null);
    setFormErrors({});
  };

  const handleOpenEditEntry = (entry: Entry) => {
    setEditingType('entry');
    setEditingId(entry.id);
    setFormOpen(true);
    setUnifiedForm({
      ...emptyUnifiedForm(),
      direction: entry.direction,
      schedule: 'date',
      amount: entry.amount,
      date: entry.date,
      categoryId: entry.categoryId,
      note: entry.note ?? '',
    });
    setError(null);
    setFormErrors({});
  };

  const handleOpenEditRecurringExpense = (p: RecurringExpensePayment) => {
    setEditingType('recurringExpense');
    setEditingId(p.id);
    setFormOpen(true);
    const r = p.recurrence;
    setUnifiedForm({
      ...emptyUnifiedForm(),
      direction: 'expense',
      schedule: r.kind === 'date' ? 'date' : 'interval',
      amount: p.amountPerOccurrence,
      categoryId: p.categoryId,
      note: p.note ?? '',
      date: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
      unit: r.kind === 'interval' ? r.unit : 'month',
      interval: r.kind === 'interval' ? String(r.interval) : '',
      anchorDate:
        r.kind === 'interval' ? r.anchorDate.slice(0, 10) : todayISO(),
      endDate: r.kind === 'interval' && r.endDate ? r.endDate.slice(0, 10) : '',
      repeatCount: p.repeatCount != null ? String(p.repeatCount) : '',
      recurrenceDate: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
    });
    setError(null);
    setFormErrors({});
  };

  const handleOpenEditRecurringIncome = (p: RecurringIncome) => {
    setEditingType('recurringIncome');
    setEditingId(p.id);
    setFormOpen(true);
    const r = p.recurrence;
    setUnifiedForm({
      ...emptyUnifiedForm(),
      direction: 'income',
      schedule: r.kind === 'date' ? 'date' : 'interval',
      amount: p.amountPerOccurrence,
      categoryId: p.categoryId,
      note: p.note ?? '',
      date: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
      unit: r.kind === 'interval' ? r.unit : 'month',
      interval: r.kind === 'interval' ? String(r.interval) : '',
      anchorDate:
        r.kind === 'interval' ? r.anchorDate.slice(0, 10) : todayISO(),
      endDate: r.kind === 'interval' && r.endDate ? r.endDate.slice(0, 10) : '',
      repeatCount: p.repeatCount != null ? String(p.repeatCount) : '',
      recurrenceDate: r.kind === 'date' ? r.date.slice(0, 10) : todayISO(),
    });
    setError(null);
    setFormErrors({});
  };

  const handleCancelForm = () => {
    setFormOpen(false);
    setEditingType(null);
    setEditingId(null);
    setUnifiedForm(emptyUnifiedForm());
    setError(null);
    setFormErrors({});
  };

  const handleUnifiedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});
    const f = unifiedForm;
    if (f.schedule === 'interval') {
      const rawInterval = f.interval.trim();
      const parsedInterval =
        rawInterval === '' ? Number.NaN : parseInt(rawInterval, 10);
      if (!Number.isFinite(parsedInterval) || parsedInterval < 1) {
        setFormErrors({ interval: 'Введите интервал (число от 1)' });
        return;
      }
      if (String(parsedInterval) !== rawInterval) {
        setUnifiedForm(prev => ({
          ...prev,
          interval: String(parsedInterval),
        }));
      }
    }
    if (f.amount <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }
    if (editingType && editingId) {
      if (editingType === 'entry') {
        if (!f.categoryId.trim()) {
          setError('Выберите категорию');
          return;
        }
        updateEntryMutation.mutate({
          id: editingId,
          data: formToEntryUpdate(f),
        });
        return;
      }
      if (editingType === 'recurringExpense') {
        if (!f.categoryId.trim()) {
          setError('Выберите категорию');
          return;
        }
        updateRecurringExpenseMutation.mutate({
          id: editingId,
          data: formToRecurringExpenseUpdate(f),
        });
        return;
      }
      if (editingType === 'recurringIncome') {
        if (!f.categoryId.trim()) {
          setError('Выберите категорию');
          return;
        }
        updateRecurringIncomeMutation.mutate({
          id: editingId,
          data: formToRecurringIncomeUpdate(f),
        });
        return;
      }
    }
    if (f.schedule === 'date') {
      if (!f.categoryId.trim()) {
        setError('Выберите категорию');
        return;
      }
      const entryData = formToEntryCreate(f);
      if (entryData) createEntryMutation.mutate(entryData);
      return;
    }
    if (f.direction === 'expense') {
      if (!f.categoryId.trim()) {
        setError('Выберите категорию');
        return;
      }
      const recExp = formToRecurringExpenseCreate(f);
      if (recExp) createRecurringExpenseMutation.mutate(recExp);
      return;
    }
    if (!f.categoryId.trim()) {
      setError('Выберите категорию');
      return;
    }
    const recInc = formToRecurringIncomeCreate(f);
    if (recInc) createRecurringIncomeMutation.mutate(recInc);
  };

  const showForm = formOpen || editingType !== null;
  const entriesLoading = entriesQuery.isPending;
  const entriesListError = entriesQuery.error
    ? entriesQuery.error instanceof Error
      ? entriesQuery.error.message
      : 'Не удалось загрузить записи'
    : null;
  const isFormPending =
    createEntryMutation.isPending ||
    updateEntryMutation.isPending ||
    createRecurringExpenseMutation.isPending ||
    updateRecurringExpenseMutation.isPending ||
    createRecurringIncomeMutation.isPending ||
    updateRecurringIncomeMutation.isPending;

  return (
    <div className={styles.page}>
      <Title order={2} mb="lg">
        Платежи и поступления
      </Title>

      {!showForm && (
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleOpenCreate}
          mb="md"
        >
          Добавить запись
        </Button>
      )}

      <section>
        <Group justify="space-between" align="center" mb="sm">
          <Title order={4}>Записи</Title>
          <Select
            size="xs"
            w={140}
            value={entryFilter}
            onChange={val => setEntryFilter((val as EntryFilterType) ?? 'all')}
            data={[
              { value: 'all', label: 'Все' },
              { value: 'income', label: 'Доходы' },
              { value: 'expense', label: 'Расходы' },
            ]}
            aria-label="Фильтр по типу"
          />
        </Group>

        {entriesLoading && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
        {entriesListError && (
          <Alert color="red" mb="sm">
            {entriesListError}
          </Alert>
        )}
        {!entriesLoading && !entriesListError && entries.length === 0 && (
          <Text c="dimmed" ta="center" py="md">
            Записей пока нет. Добавьте первую.
          </Text>
        )}
        {!entriesLoading && !entriesListError && entries.length > 0 && (
          <Stack component="ul" className={styles.list} gap="xs">
            {entries.map(entry => {
              const cat = categoryMap.get(entry.categoryId);
              const isIncome = entry.direction === 'income';
              return (
                <Card
                  key={entry.id}
                  component="li"
                  withBorder
                  radius="md"
                  padding="sm"
                >
                  <Group align="flex-start" gap="sm" wrap="nowrap">
                    {cat && (
                      <span
                        className={styles.colorSwatch}
                        style={
                          {
                            '--swatch-color': cat.color || undefined,
                          } as React.CSSProperties
                        }
                        aria-hidden
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs" align="center">
                        <Badge
                          color={isIncome ? 'green' : 'red'}
                          radius="sm"
                          size="sm"
                        >
                          {isIncome ? 'Доход' : 'Расход'}
                        </Badge>
                        <Text component="span" size="sm" c="dimmed">
                          {formatDate(entry.date)}
                        </Text>
                      </Group>
                      <Text component="span" fw={600}>
                        {isIncome ? '+' : '−'}
                        {entry.amount.toLocaleString('ru-RU')} ₽
                      </Text>
                      {cat && (
                        <Text component="span" size="sm">
                          {cat.icon ? `${cat.icon} ` : ''}
                          {cat.name}
                        </Text>
                      )}
                      {entry.note && (
                        <Text component="span" size="sm" c="dimmed">
                          {entry.note}
                        </Text>
                      )}
                    </div>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        variant="subtle"
                        aria-label="Редактировать"
                        onClick={() => handleOpenEditEntry(entry)}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                      {entryDeleteConfirmId === entry.id ? (
                        <Group gap={4} wrap="nowrap">
                          <Text component="span" size="xs" c="dimmed">
                            Удалить?
                          </Text>
                          <Button
                            size="compact-xs"
                            color="red"
                            onClick={() => deleteEntryMutation.mutate(entry.id)}
                            loading={deleteEntryMutation.isPending}
                          >
                            Да
                          </Button>
                          <Button
                            size="compact-xs"
                            variant="default"
                            onClick={() => setEntryDeleteConfirmId(null)}
                          >
                            Нет
                          </Button>
                        </Group>
                      ) : (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Удалить"
                          onClick={() => setEntryDeleteConfirmId(entry.id)}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}
      </section>

      <section className={styles.recurringSection}>
        <Title order={4} mb="sm">
          Повторяющиеся платежи
        </Title>
        {recurringExpenseQuery.isPending && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
        {recurringExpenseQuery.error && (
          <Alert color="red" mb="sm">
            {recurringExpenseQuery.error instanceof Error
              ? recurringExpenseQuery.error.message
              : 'Не удалось загрузить'}
          </Alert>
        )}
        {!recurringExpenseQuery.isPending &&
          !recurringExpenseQuery.error &&
          recurringExpenseList.length === 0 && (
            <Text c="dimmed" ta="center" py="md">
              Повторяющихся платежей нет.
            </Text>
          )}
        {!recurringExpenseQuery.isPending &&
          !recurringExpenseQuery.error &&
          recurringExpenseList.length > 0 && (
            <Stack component="ul" className={styles.list} gap="xs">
              {recurringExpenseList.map(p => {
                const cat = categoryMap.get(p.categoryId);
                return (
                  <Card
                    key={p.id}
                    component="li"
                    withBorder
                    radius="md"
                    padding="sm"
                  >
                    <Group align="flex-start" gap="sm" wrap="nowrap">
                      {cat && (
                        <span
                          className={styles.colorSwatch}
                          style={
                            {
                              '--swatch-color': cat.color || undefined,
                            } as React.CSSProperties
                          }
                          aria-hidden
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs" align="center" mb={4}>
                          <Badge color="red" radius="sm" size="sm">
                            Расход
                          </Badge>
                          <Badge color="gray" radius="sm" size="sm">
                            Повторяющийся
                          </Badge>
                        </Group>
                        <Text component="span" fw={600} c="red">
                          −{p.amountPerOccurrence.toLocaleString('ru-RU')} ₽
                        </Text>
                        <Text component="span" size="sm" c="dimmed">
                          {describeRecurrence(p.recurrence)}
                        </Text>
                        {cat && (
                          <Text component="span" size="sm">
                            {cat.icon ? `${cat.icon} ` : ''}
                            {cat.name}
                          </Text>
                        )}
                        {p.note && (
                          <Text component="span" size="sm" c="dimmed">
                            {p.note}
                          </Text>
                        )}
                      </div>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          aria-label="Редактировать"
                          onClick={() => handleOpenEditRecurringExpense(p)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        {recurringExpenseDeleteId === p.id ? (
                          <Group gap={4} wrap="nowrap">
                            <Text component="span" size="xs" c="dimmed">
                              Удалить?
                            </Text>
                            <Button
                              size="compact-xs"
                              color="red"
                              onClick={() =>
                                deleteRecurringExpenseMutation.mutate(p.id)
                              }
                              loading={deleteRecurringExpenseMutation.isPending}
                            >
                              Да
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="default"
                              onClick={() => setRecurringExpenseDeleteId(null)}
                            >
                              Нет
                            </Button>
                          </Group>
                        ) : (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Удалить"
                            onClick={() => setRecurringExpenseDeleteId(p.id)}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          )}
      </section>

      <section className={styles.recurringSection}>
        <Title order={4} mb="sm">
          Повторяющиеся поступления
        </Title>
        {recurringIncomeQuery.isPending && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
        {recurringIncomeQuery.error && (
          <Alert color="red" mb="sm">
            {recurringIncomeQuery.error instanceof Error
              ? recurringIncomeQuery.error.message
              : 'Не удалось загрузить'}
          </Alert>
        )}
        {!recurringIncomeQuery.isPending &&
          !recurringIncomeQuery.error &&
          recurringIncomeList.length === 0 && (
            <Text c="dimmed" ta="center" py="md">
              Повторяющихся поступлений нет.
            </Text>
          )}
        {!recurringIncomeQuery.isPending &&
          !recurringIncomeQuery.error &&
          recurringIncomeList.length > 0 && (
            <Stack component="ul" className={styles.list} gap="xs">
              {recurringIncomeList.map(p => {
                const cat = categoryMap.get(p.categoryId);
                return (
                  <Card
                    key={p.id}
                    component="li"
                    withBorder
                    radius="md"
                    padding="sm"
                  >
                    <Group align="flex-start" gap="sm" wrap="nowrap">
                      {cat && (
                        <span
                          className={styles.colorSwatch}
                          style={
                            {
                              '--swatch-color': cat.color || undefined,
                            } as React.CSSProperties
                          }
                          aria-hidden
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs" align="center" mb={4}>
                          <Badge color="green" radius="sm" size="sm">
                            Доход
                          </Badge>
                          <Badge color="gray" radius="sm" size="sm">
                            Повторяющийся
                          </Badge>
                        </Group>
                        <Text component="span" fw={600} c="teal">
                          +{p.amountPerOccurrence.toLocaleString('ru-RU')} ₽
                        </Text>
                        <Text component="span" size="sm" c="dimmed">
                          {describeRecurrence(p.recurrence)}
                        </Text>
                        {cat && (
                          <Text component="span" size="sm">
                            {cat.icon ? `${cat.icon} ` : ''}
                            {cat.name}
                          </Text>
                        )}
                        {p.note && (
                          <Text component="span" size="sm" c="dimmed">
                            {p.note}
                          </Text>
                        )}
                      </div>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          aria-label="Редактировать"
                          onClick={() => handleOpenEditRecurringIncome(p)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        {recurringIncomeDeleteId === p.id ? (
                          <Group gap={4} wrap="nowrap">
                            <Text component="span" size="xs" c="dimmed">
                              Удалить?
                            </Text>
                            <Button
                              size="compact-xs"
                              color="red"
                              onClick={() =>
                                deleteRecurringIncomeMutation.mutate(p.id)
                              }
                              loading={deleteRecurringIncomeMutation.isPending}
                            >
                              Да
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="default"
                              onClick={() => setRecurringIncomeDeleteId(null)}
                            >
                              Нет
                            </Button>
                          </Group>
                        ) : (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Удалить"
                            onClick={() => setRecurringIncomeDeleteId(p.id)}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          )}
      </section>

      <ResponsiveModal
        isOpen={showForm}
        onClose={handleCancelForm}
        title={editingType ? 'Редактировать запись' : 'Новая запись'}
      >
        <EntryForm
          value={unifiedForm}
          onChange={next => setUnifiedForm(next)}
          editingType={editingType}
          categories={categories}
          error={error}
          intervalError={formErrors.interval ?? null}
          isPending={isFormPending}
          onSubmit={handleUnifiedSubmit}
          onCancel={handleCancelForm}
        />
      </ResponsiveModal>
    </div>
  );
}
