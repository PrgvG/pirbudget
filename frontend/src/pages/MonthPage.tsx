import { useState, useMemo } from 'react';
import {
  Alert,
  Badge,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { Transaction } from 'shared/transactions';
import type { PlannedItem } from 'shared';
import type { Category } from 'shared/categories';
import {
  fetchHistory,
  fetchPlan,
  fetchMonthStats,
  type HistoryParams,
} from '../domains/transactions';
import { fetchCategories } from '../domains/categories';
import { useMonthPicker, MonthPicker } from '../components/month-picker';
import styles from './MonthPage.module.css';

const STATS_QUERY_KEY = 'monthStats';
const HISTORY_QUERY_KEY = 'history';
const PLAN_QUERY_KEY = 'plan';
const CATEGORIES_QUERY_KEY = ['categories'] as const;

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDateLabel(isoDate: string): string {
  try {
    const d = isoDate.slice(0, 10);
    const [year, month, day] = d.split('-');
    if (!year || !month || !day) return d;
    return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
  } catch {
    return isoDate.slice(0, 10);
  }
}

function groupTransactionsByDate(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const dateKey = 'date' in t ? String(t.date).slice(0, 10) : '';
    if (!dateKey) continue;
    const list = map.get(dateKey) ?? [];
    list.push(t);
    map.set(dateKey, list);
  }
  const sorted = new Map<string, Transaction[]>();
  for (const key of [...map.keys()].sort((a, b) => b.localeCompare(a))) {
    sorted.set(key, map.get(key)!);
  }
  return sorted;
}

function groupPlanItemsByDate(
  items: PlannedItem[]
): Map<string, PlannedItem[]> {
  const map = new Map<string, PlannedItem[]>();
  for (const item of items) {
    const dateKey = item.scheduledDate.slice(0, 10);
    const list = map.get(dateKey) ?? [];
    list.push(item);
    map.set(dateKey, list);
  }
  const sorted = new Map<string, PlannedItem[]>();
  for (const key of [...map.keys()].sort((a, b) => a.localeCompare(b))) {
    sorted.set(key, map.get(key)!);
  }
  return sorted;
}

type HistoryFilters = {
  type: 'all' | 'income' | 'expense';
  categoryId: string;
};

const defaultHistoryFilters: HistoryFilters = {
  type: 'all',
  categoryId: '',
};

export function MonthPage() {
  const monthPicker = useMonthPicker();
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>(
    defaultHistoryFilters
  );

  const historyParams: HistoryParams = useMemo(
    () => ({
      from: monthPicker.from,
      to: monthPicker.to,
      type: historyFilters.type === 'all' ? undefined : historyFilters.type,
      categoryId: historyFilters.categoryId || undefined,
    }),
    [
      monthPicker.from,
      monthPicker.to,
      historyFilters.type,
      historyFilters.categoryId,
    ]
  );

  const statsQuery = useQuery({
    queryKey: [STATS_QUERY_KEY, monthPicker.month],
    queryFn: () => fetchMonthStats(monthPicker.month),
  });

  const historyQuery = useQuery({
    queryKey: [HISTORY_QUERY_KEY, historyParams],
    queryFn: () => fetchHistory(historyParams),
  });

  const planQuery = useQuery({
    queryKey: [PLAN_QUERY_KEY, monthPicker.from, monthPicker.to],
    queryFn: () => fetchPlan({ from: monthPicker.from, to: monthPicker.to }),
  });

  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => fetchCategories(),
  });

  const allCategories = categoriesQuery.data ?? [];
  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of allCategories) m.set(c.id, c);
    return m;
  }, [allCategories]);

  const stats = statsQuery.data;
  const sortedByIncomeCategory = useMemo(() => {
    if (!stats?.incomeByCategory?.length) return [];
    return [...stats.incomeByCategory].sort((a, b) => {
      const ca = categoryMap.get(a.categoryId);
      const cb = categoryMap.get(b.categoryId);
      const orderA = ca?.sortOrder ?? 999;
      const orderB = cb?.sortOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return b.sum - a.sum;
    });
  }, [stats, categoryMap]);

  const sortedByExpenseCategory = useMemo(() => {
    if (!stats?.expensesByCategory?.length) return [];
    return [...stats.expensesByCategory].sort((a, b) => {
      const ca = categoryMap.get(a.categoryId);
      const cb = categoryMap.get(b.categoryId);
      const orderA = ca?.sortOrder ?? 999;
      const orderB = cb?.sortOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return b.sum - a.sum;
    });
  }, [stats, categoryMap]);

  const transactions = historyQuery.data ?? [];
  const historyByDate = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions]
  );

  const planItems = planQuery.data ?? [];
  const planByDate = useMemo(
    () => groupPlanItemsByDate(planItems),
    [planItems]
  );

  const filteredCategories = allCategories.filter(
    c =>
      historyFilters.type === 'all' ||
      (historyFilters.type === 'income' && c.direction === 'income') ||
      (historyFilters.type === 'expense' && c.direction === 'expense')
  );

  return (
    <div className={styles.page}>
      <Title order={2} mb="lg">
        Месяц
      </Title>

      <section style={{ marginBottom: 'var(--mantine-spacing-lg)' }}>
        <MonthPicker
          id="month-page-picker"
          label="Период"
          monthLabel={monthPicker.monthLabel}
          onPrev={monthPicker.handlePrevMonth}
          onNext={monthPicker.handleNextMonth}
          canPrev={monthPicker.canPrev}
          canNext={monthPicker.canNext}
        />
      </section>

      <section style={{ marginBottom: 'var(--mantine-spacing-lg)' }}>
        <Title order={4} mb="sm">
          Итоги за месяц
        </Title>
        {statsQuery.isPending && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
        {statsQuery.error && (
          <Alert color="red" mb="sm">
            {statsQuery.error instanceof Error
              ? statsQuery.error.message
              : 'Не удалось загрузить итоги'}
          </Alert>
        )}
        {!statsQuery.isPending && !statsQuery.error && stats && (
          <Paper withBorder radius="md" p="md">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text>Доходы</Text>
                <Text fw={600} c="teal">
                  +{formatMoney(stats.totalIncome)} ₽
                </Text>
              </Group>
              <Group justify="space-between">
                <Text>Расходы</Text>
                <Text fw={600} c="red">
                  −{formatMoney(stats.totalExpense)} ₽
                </Text>
              </Group>
              <Divider />
              <Group justify="space-between">
                <Text fw={600}>Баланс</Text>
                <Text fw={700} c={stats.balance >= 0 ? 'teal' : 'red'}>
                  {stats.balance >= 0 ? '+' : ''}
                  {formatMoney(stats.balance)} ₽
                </Text>
              </Group>
            </Stack>

            {sortedByIncomeCategory.length > 0 && (
              <>
                <Divider my="sm" />
                <Text size="sm" fw={600} mb="xs">
                  Доходы по категориям
                </Text>
                <Stack gap={4}>
                  {sortedByIncomeCategory.map(({ categoryId, sum }) => {
                    const cat = categoryMap.get(categoryId);
                    return (
                      <Group key={categoryId} justify="space-between">
                        <Text size="sm">{cat?.name ?? categoryId}</Text>
                        <Text size="sm" fw={500} c="teal">
                          +{formatMoney(sum)} ₽
                        </Text>
                      </Group>
                    );
                  })}
                </Stack>
              </>
            )}

            {sortedByExpenseCategory.length > 0 && (
              <>
                <Divider my="sm" />
                <Text size="sm" fw={600} mb="xs">
                  Расходы по категориям
                </Text>
                <Stack gap={4}>
                  {sortedByExpenseCategory.map(({ categoryId, sum }) => {
                    const cat = categoryMap.get(categoryId);
                    return (
                      <Group key={categoryId} justify="space-between">
                        <Text size="sm">{cat?.name ?? categoryId}</Text>
                        <Text size="sm" fw={500} c="red">
                          −{formatMoney(sum)} ₽
                        </Text>
                      </Group>
                    );
                  })}
                </Stack>
              </>
            )}
          </Paper>
        )}
      </section>

      <section style={{ marginBottom: 'var(--mantine-spacing-lg)' }}>
        <Title order={4} mb="sm">
          История операций
        </Title>
        <Group gap="sm" mb="sm" align="flex-end">
          <Select
            label="Тип"
            size="xs"
            w={120}
            value={historyFilters.type}
            onChange={val =>
              setHistoryFilters(f => ({
                ...f,
                type: (val as HistoryFilters['type']) ?? 'all',
              }))
            }
            data={[
              { value: 'all', label: 'Все' },
              { value: 'income', label: 'Доходы' },
              { value: 'expense', label: 'Расходы' },
            ]}
          />
          <Select
            label="Категория"
            size="xs"
            w={160}
            value={historyFilters.categoryId || null}
            onChange={val =>
              setHistoryFilters(f => ({
                ...f,
                categoryId: val ?? '',
              }))
            }
            data={[
              { value: '', label: 'Все категории' },
              ...filteredCategories.map(c => ({
                value: c.id,
                label: c.name,
              })),
            ]}
            clearable
          />
        </Group>

        {historyQuery.isPending && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
        {historyQuery.error && (
          <Alert color="red" mb="sm">
            {historyQuery.error instanceof Error
              ? historyQuery.error.message
              : 'Не удалось загрузить историю'}
          </Alert>
        )}
        {!historyQuery.isPending &&
          !historyQuery.error &&
          transactions.length === 0 && (
            <Text c="dimmed" ta="center" py="md">
              За выбранный период операций нет.
            </Text>
          )}
        {!historyQuery.isPending &&
          !historyQuery.error &&
          historyByDate.size > 0 && (
            <Stack gap="md">
              {Array.from(historyByDate.entries()).map(([dateKey, list]) => (
                <div key={dateKey}>
                  <Text size="sm" fw={600} mb="xs" c="dimmed">
                    {formatDateLabel(dateKey)}
                  </Text>
                  <Stack gap="xs">
                    {list.map(t => (
                      <TransactionCard
                        key={`${t.direction}-${t.id}`}
                        transaction={t}
                        categoryName={
                          'categoryId' in t
                            ? (categoryMap.get(t.categoryId)?.name ??
                              t.categoryId)
                            : undefined
                        }
                      />
                    ))}
                  </Stack>
                </div>
              ))}
            </Stack>
          )}
      </section>

      <section>
        <Title order={4} mb="sm">
          План платежей
        </Title>
        {planQuery.isPending && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
        {planQuery.error && (
          <Alert color="red" mb="sm">
            {planQuery.error instanceof Error
              ? planQuery.error.message
              : 'Не удалось загрузить план'}
          </Alert>
        )}
        {!planQuery.isPending && !planQuery.error && planItems.length === 0 && (
          <Text c="dimmed" ta="center" py="md">
            На выбранный период запланированных платежей нет.
          </Text>
        )}
        {!planQuery.isPending && !planQuery.error && planByDate.size > 0 && (
          <Stack gap="md">
            {Array.from(planByDate.entries()).map(([dateKey, list]) => (
              <div key={dateKey}>
                <Text size="sm" fw={600} mb="xs" c="dimmed">
                  {formatDateLabel(dateKey)}
                </Text>
                <Stack gap="xs">
                  {list.map((item, idx) => (
                    <PlannedItemCard
                      key={`${item.kind}-${item.paymentId}-${dateKey}-${idx}`}
                      item={item}
                      categoryName={categoryMap.get(item.categoryId)?.name}
                    />
                  ))}
                </Stack>
              </div>
            ))}
          </Stack>
        )}
      </section>
    </div>
  );
}

type TransactionCardProps = {
  transaction: Transaction;
  categoryName?: string;
};

function TransactionCard({ transaction, categoryName }: TransactionCardProps) {
  const isIncome = transaction.direction === 'income';
  const amount = 'amount' in transaction ? transaction.amount : 0;
  const note = 'note' in transaction ? transaction.note : undefined;

  return (
    <Card component="li" withBorder radius="md" padding="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Badge
            color={isIncome ? 'green' : 'red'}
            size="xs"
            radius="sm"
            mb={4}
          >
            {isIncome ? 'Доход' : 'Расход'}
          </Badge>
          {categoryName && (
            <Text size="sm" c="dimmed">
              {categoryName}
            </Text>
          )}
          {note && (
            <Text size="xs" c="dimmed">
              {note}
            </Text>
          )}
        </div>
        <Text fw={600} c={isIncome ? 'teal' : 'red'}>
          {isIncome ? '+' : '−'}
          {amount.toLocaleString('ru-RU')} ₽
        </Text>
      </Group>
    </Card>
  );
}

type PlannedItemCardProps = {
  item: PlannedItem;
  categoryName?: string;
};

function PlannedItemCard({ item, categoryName }: PlannedItemCardProps) {
  const isIncome = item.kind === 'recurringIncome';
  const typeLabel =
    item.kind === 'recurring'
      ? 'Повторяющийся'
      : item.kind === 'recurringIncome'
        ? 'Повторяющийся доход'
        : 'Разовый';

  return (
    <Card component="li" withBorder radius="md" padding="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Badge
            color={isIncome ? 'green' : 'gray'}
            size="xs"
            radius="sm"
            mb={4}
          >
            {typeLabel}
          </Badge>
          {categoryName != null && categoryName !== '' && (
            <Text size="sm" c="dimmed">
              {categoryName}
            </Text>
          )}
          {item.note && (
            <Text size="xs" c="dimmed">
              {item.note}
            </Text>
          )}
        </div>
        <Text fw={600} c={isIncome ? 'teal' : 'red'}>
          {isIncome ? '+' : '−'}
          {item.amount.toLocaleString('ru-RU')} ₽
        </Text>
      </Group>
    </Card>
  );
}
