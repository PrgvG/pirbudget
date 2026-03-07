import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { Transaction } from 'shared/transactions';
import type { PaymentGroup } from 'shared/payment-groups';
import { fetchHistory, type HistoryParams } from '../domains/transactions';
import { fetchPaymentGroups } from '../domains/payment-groups';
import styles from './HistoryPage.module.css';

const HISTORY_QUERY_KEY = 'history';
const GROUPS_QUERY_KEY = ['payment-groups'] as const;

function getMonthBounds(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split('-').map(Number);
  const from = `${monthStr}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
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

function currentMonthStr(): string {
  return new Date().toISOString().slice(0, 7);
}

function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
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

type HistoryFilters = {
  month: string;
  type: 'all' | 'income' | 'expense';
  groupId: string;
};

const defaultFilters: HistoryFilters = {
  month: currentMonthStr(),
  type: 'all',
  groupId: '',
};

export function HistoryPage() {
  const [filters, setFilters] = useState<HistoryFilters>(defaultFilters);

  const { from, to } = useMemo(
    () => getMonthBounds(filters.month),
    [filters.month]
  );

  const historyParams: HistoryParams = useMemo(
    () => ({
      from,
      to,
      type: filters.type === 'all' ? undefined : filters.type,
      groupId: filters.groupId || undefined,
    }),
    [from, to, filters.type, filters.groupId]
  );

  const historyQuery = useQuery({
    queryKey: [HISTORY_QUERY_KEY, historyParams],
    queryFn: () => fetchHistory(historyParams),
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

  const handlePrevMonth = () => {
    const [y, m] = filters.month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setFilters(f => ({ ...f, month: d.toISOString().slice(0, 7) }));
  };

  const handleNextMonth = () => {
    const [y, m] = filters.month.split('-').map(Number);
    const d = new Date(y, m, 1);
    setFilters(f => ({ ...f, month: d.toISOString().slice(0, 7) }));
  };

  const canPrev = filters.month > '2000-01';
  const canNext = filters.month < currentMonthStr();

  const transactions = historyQuery.data ?? [];
  const byDate = useMemo(() => groupByDate(transactions), [transactions]);

  const monthLabel = useMemo(() => {
    const [y, m] = filters.month.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
    });
  }, [filters.month]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>История</h1>
        <Link to="/" className={styles.backLink}>
          На главную
        </Link>
      </header>

      <section className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Период</label>
          <div className={styles.monthNav}>
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!canPrev}
              aria-label="Предыдущий месяц"
            >
              ←
            </button>
            <span>{monthLabel}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={!canNext}
              aria-label="Следующий месяц"
            >
              →
            </button>
          </div>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="history-type">Тип</label>
          <select
            id="history-type"
            value={filters.type}
            onChange={e =>
              setFilters(f => ({
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
        {(filters.type === 'all' || filters.type === 'expense') && (
          <div className={styles.filterGroup}>
            <label htmlFor="history-group">Группа</label>
            <select
              id="history-group"
              value={filters.groupId}
              onChange={e =>
                setFilters(f => ({ ...f, groupId: e.target.value }))
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
      </section>

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
      {!historyQuery.isPending && !historyQuery.error && transactions.length === 0 && (
        <p className={styles.empty}>
          За выбранный период операций нет.
        </p>
      )}
      {!historyQuery.isPending && !historyQuery.error && byDate.size > 0 && (
        <div className={styles.dateSection}>
          {Array.from(byDate.entries()).map(([dateKey, list]) => (
            <div key={dateKey}>
              <h2 className={styles.dateHeading}>
                {formatDateLabel(dateKey)}
              </h2>
              <ul className={styles.list}>
                {list.map(t => (
                  <TransactionCard
                    key={`${t.direction}-${t.id}`}
                    transaction={t}
                    groupName={t.direction === 'expense' && 'groupId' in t
                      ? groupMap.get(t.groupId)?.name ?? t.groupId
                      : undefined}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type TransactionCardProps = {
  transaction: Transaction;
  groupName?: string;
};

function TransactionCard({ transaction, groupName }: TransactionCardProps) {
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
