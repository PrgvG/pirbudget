import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { PaymentGroup } from 'shared/payment-groups';
import { fetchMonthStats } from '../domains/transactions';
import { fetchPaymentGroups } from '../domains/payment-groups';
import styles from './StatisticsPage.module.css';

const STATS_QUERY_KEY = 'monthStats';
const GROUPS_QUERY_KEY = ['payment-groups'] as const;

function currentMonthStr(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function StatisticsPage() {
  const [month, setMonth] = useState(currentMonthStr());

  const statsQuery = useQuery({
    queryKey: [STATS_QUERY_KEY, month],
    queryFn: () => fetchMonthStats(month),
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
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m, 1);
    setMonth(d.toISOString().slice(0, 7));
  };

  const canPrev = month > '2000-01';
  const canNext = month < currentMonthStr();

  const monthLabel = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
    });
  }, [month]);

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Статистика за месяц</h1>
        <Link to="/" className={styles.backLink}>
          На главную
        </Link>
      </header>

      <section className={styles.monthSection}>
        <label className={styles.monthLabel}>Период</label>
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
      </section>

      {statsQuery.isPending && (
        <p className={styles.status}>Загрузка статистики...</p>
      )}
      {statsQuery.error && (
        <p className={styles.error}>
          {statsQuery.error instanceof Error
            ? statsQuery.error.message
            : 'Не удалось загрузить статистику'}
        </p>
      )}

      {!statsQuery.isPending && !statsQuery.error && stats && (
        <>
          <section className={styles.totals}>
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
          </section>

          {sortedByGroup.length > 0 ? (
            <section className={styles.byGroup}>
              <h2 className={styles.byGroupTitle}>Расходы по группам</h2>
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
            </section>
          ) : (
            <p className={styles.empty}>Нет расходов по группам за этот месяц.</p>
          )}
        </>
      )}
    </div>
  );
}
