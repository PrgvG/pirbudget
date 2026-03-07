import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { Transaction } from 'shared/transactions';
import type { PlannedItem } from 'shared';
import type { PaymentGroup } from 'shared/payment-groups';
import {
  fetchHistory,
  fetchPlan,
  fetchMonthStats,
  type HistoryParams,
} from '../domains/transactions';
import { fetchPaymentGroups } from '../domains/payment-groups';
import { useMonthPicker, MonthPicker } from '../components/month-picker';
import styles from './MonthPage.module.css';

const STATS_QUERY_KEY = 'monthStats';
const HISTORY_QUERY_KEY = 'history';
const PLAN_QUERY_KEY = 'plan';
const GROUPS_QUERY_KEY = ['payment-groups'] as const;

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDateLabel(isoDate: string): string {
  try {
    const d = isoDate.slice(0, 10);
    return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
  groupId: string;
};

const defaultHistoryFilters: HistoryFilters = {
  type: 'all',
  groupId: '',
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
      groupId: historyFilters.groupId || undefined,
    }),
    [
      monthPicker.from,
      monthPicker.to,
      historyFilters.type,
      historyFilters.groupId,
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

  const groupsQuery = useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: fetchPaymentGroups,
  });

  const groups = groupsQuery.data ?? [];
  const groupMap = useMemo(() => {
    const m = new Map<string, PaymentGroup>();
    for (const g of groups) m.set(g.id, g);
    return m;
  }, [groups]);

  const stats = statsQuery.data;
  const sortedByGroup = useMemo(() => {
    if (!stats || stats.expensesByGroup.length === 0) return [];
    return [...stats.expensesByGroup].sort((a, b) => {
      const ga = groupMap.get(a.groupId);
      const gb = groupMap.get(b.groupId);
      const orderA = ga?.sortOrder ?? 999;
      const orderB = gb?.sortOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return b.sum - a.sum;
    });
  }, [stats, groupMap]);

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Месяц</h1>
        <Link to="/" className={styles.backLink}>
          На главную
        </Link>
      </header>

      <section className={styles.monthSection}>
        <MonthPicker
          id="month-page-picker"
          label="Период"
          month={monthPicker.month}
          monthLabel={monthPicker.monthLabel}
          onPrev={monthPicker.handlePrevMonth}
          onNext={monthPicker.handleNextMonth}
          onMonthChange={monthPicker.handleMonthChange}
          canPrev={monthPicker.canPrev}
          canNext={monthPicker.canNext}
        />
      </section>

      <section className={styles.totals} aria-labelledby="month-totals-title">
        <h2 id="month-totals-title" className={styles.sectionTitle}>
          Итоги за месяц
        </h2>
        {statsQuery.isPending && (
          <p className={styles.status}>Загрузка итогов...</p>
        )}
        {statsQuery.error && (
          <p className={styles.error}>
            {statsQuery.error instanceof Error
              ? statsQuery.error.message
              : 'Не удалось загрузить итоги'}
          </p>
        )}
        {!statsQuery.isPending && !statsQuery.error && stats && (
          <>
            <div className={styles.totalsBlock}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Доходы</span>
                <span className={`${styles.totalValue} ${styles.income}`}>
                  +{formatMoney(stats.totalIncome)} ₽
                </span>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Расходы</span>
                <span className={`${styles.totalValue} ${styles.expense}`}>
                  −{formatMoney(stats.totalExpense)} ₽
                </span>
              </div>
              <div className={`${styles.totalRow} ${styles.balanceRow}`}>
                <span className={styles.totalLabel}>Баланс</span>
                <span
                  className={`${styles.totalValue} ${
                    stats.balance >= 0 ? styles.income : styles.expense
                  }`}
                >
                  {stats.balance >= 0 ? '+' : ''}
                  {formatMoney(stats.balance)} ₽
                </span>
              </div>
            </div>
            {sortedByGroup.length > 0 ? (
              <div className={styles.byGroup}>
                <h3 className={styles.byGroupTitle}>Расходы по группам</h3>
                <ul className={styles.groupList}>
                  {sortedByGroup.map(({ groupId, sum }) => {
                    const group = groupMap.get(groupId);
                    const name = group?.name ?? groupId;
                    return (
                      <li key={groupId} className={styles.groupItem}>
                        <span className={styles.groupName}>{name}</span>
                        <span className={styles.groupSum}>
                          −{formatMoney(sum)} ₽
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section
        className={styles.historySection}
        aria-labelledby="month-history-title"
      >
        <h2 id="month-history-title" className={styles.sectionTitle}>
          История операций
        </h2>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="month-history-type">Тип</label>
            <select
              id="month-history-type"
              value={historyFilters.type}
              onChange={e =>
                setHistoryFilters(f => ({
                  ...f,
                  type: e.target.value as HistoryFilters['type'],
                }))
              }
            >
              <option value="all">Все</option>
              <option value="income">Доходы</option>
              <option value="expense">Расходы</option>
            </select>
          </div>
          {(historyFilters.type === 'all' || historyFilters.type === 'expense') && (
            <div className={styles.filterGroup}>
              <label htmlFor="month-history-group">Группа</label>
              <select
                id="month-history-group"
                value={historyFilters.groupId}
                onChange={e =>
                  setHistoryFilters(f => ({ ...f, groupId: e.target.value }))
                }
              >
                <option value="">Все группы</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {historyQuery.isPending && (
          <p className={styles.status}>Загрузка операций...</p>
        )}
        {historyQuery.error && (
          <p className={styles.error}>
            {historyQuery.error instanceof Error
              ? historyQuery.error.message
              : 'Не удалось загрузить историю'}
          </p>
        )}
        {!historyQuery.isPending &&
          !historyQuery.error &&
          transactions.length === 0 && (
            <p className={styles.empty}>За выбранный период операций нет.</p>
          )}
        {!historyQuery.isPending &&
          !historyQuery.error &&
          historyByDate.size > 0 && (
            <div className={styles.dateSection}>
              {Array.from(historyByDate.entries()).map(([dateKey, list]) => (
                <div key={dateKey}>
                  <h3 className={styles.dateHeading}>
                    {formatDateLabel(dateKey)}
                  </h3>
                  <ul className={styles.list}>
                    {list.map(t => (
                      <TransactionCard
                        key={`${t.direction}-${t.id}`}
                        transaction={t}
                        groupName={
                          t.direction === 'expense' && 'groupId' in t
                            ? groupMap.get(t.groupId)?.name ?? t.groupId
                            : undefined
                        }
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
      </section>

      <section
        className={styles.planSection}
        aria-labelledby="month-plan-title"
      >
        <h2 id="month-plan-title" className={styles.sectionTitle}>
          План платежей
        </h2>
        {planQuery.isPending && (
          <p className={styles.status}>Загрузка плана...</p>
        )}
        {planQuery.error && (
          <p className={styles.error}>
            {planQuery.error instanceof Error
              ? planQuery.error.message
              : 'Не удалось загрузить план'}
          </p>
        )}
        {!planQuery.isPending && !planQuery.error && planItems.length === 0 && (
          <p className={styles.empty}>
            На выбранный период запланированных платежей нет.
          </p>
        )}
        {!planQuery.isPending &&
          !planQuery.error &&
          planByDate.size > 0 && (
            <div className={styles.dateSection}>
              {Array.from(planByDate.entries()).map(([dateKey, list]) => (
                <div key={dateKey}>
                  <h3 className={styles.dateHeading}>
                    {formatDateLabel(dateKey)}
                  </h3>
                  <ul className={styles.list}>
                    {list.map((item, idx) => (
                      <PlannedItemCard
                        key={`${item.kind}-${item.paymentId}-${dateKey}-${idx}`}
                        item={item}
                        groupName={groupMap.get(item.groupId)?.name}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}

type TransactionCardProps = {
  transaction: Transaction;
  groupName?: string;
};

function TransactionCard({
  transaction,
  groupName,
}: TransactionCardProps) {
  const isIncome = transaction.direction === 'income';
  const amount = 'amount' in transaction ? transaction.amount : 0;
  const note = 'note' in transaction ? transaction.note : undefined;

  return (
    <li className={styles.card}>
      <div className={styles.cardMain}>
        <div
          className={`${styles.cardType} ${isIncome ? styles.income : styles.expense}`}
        >
          {isIncome ? 'Доход' : 'Расход'}
        </div>
        {isIncome && 'source' in transaction && (
          <span className={styles.cardSource}>{transaction.source}</span>
        )}
        {!isIncome && groupName && (
          <span className={styles.cardGroup}>{groupName}</span>
        )}
        {note ? (
          <div className={styles.cardNote}>{note}</div>
        ) : null}
      </div>
      <div
        className={`${styles.cardAmount} ${isIncome ? styles.income : styles.expense}`}
      >
        {isIncome ? '+' : '−'}
        {amount.toLocaleString('ru-RU')} ₽
      </div>
    </li>
  );
}

type PlannedItemCardProps = {
  item: PlannedItem;
  groupName?: string;
};

function PlannedItemCard({ item, groupName }: PlannedItemCardProps) {
  const typeLabel =
    item.kind === 'recurring' ? 'Повторяющийся' : 'Разовый';

  return (
    <li className={styles.card}>
      <div className={styles.cardMain}>
        <div className={styles.cardType}>{typeLabel}</div>
        {groupName && (
          <span className={styles.cardGroup}>{groupName}</span>
        )}
        {item.note ? (
          <div className={styles.cardNote}>{item.note}</div>
        ) : null}
      </div>
      <div className={styles.cardAmount}>
        −{item.amount.toLocaleString('ru-RU')} ₽
      </div>
    </li>
  );
}
