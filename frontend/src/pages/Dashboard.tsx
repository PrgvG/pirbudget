import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { fetchMonthStats } from '../domains/transactions';
import { currentMonthStr } from '../components/month-picker';
import styles from './Dashboard.module.css';

const DASHBOARD_STATS_KEY = ['dashboardMonthStats'] as const;

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
}

export function Dashboard() {
  const month = currentMonthStr();
  const statsQuery = useQuery({
    queryKey: [...DASHBOARD_STATS_KEY, month],
    queryFn: () => fetchMonthStats(month),
  });

  const stats = statsQuery.data;

  return (
    <>
      <section className={styles.welcome}>
        <h2>Добро пожаловать в PirBudget</h2>
        <p>
          Учёт бюджета: группы платежей, поступления, обязательные платежи,
          история операций, план и статистика за месяц.
        </p>
        <p className={styles.navHint}>
          Выберите раздел в меню внизу.
        </p>
      </section>

      <section className={styles.stats} aria-labelledby="dashboard-stats-title">
        <h2 id="dashboard-stats-title" className={styles.statsTitle}>
          Статистика за {formatMonthLabel(month)}
        </h2>
        {statsQuery.isPending && (
          <p className={styles.statsStatus}>Загрузка...</p>
        )}
        {statsQuery.error && (
          <p className={styles.statsError}>
            Не удалось загрузить данные за месяц.
          </p>
        )}
        {!statsQuery.isPending && !statsQuery.error && stats && (
          <>
            <div className={styles.totals}>
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
            <Link to="/month" className={styles.statsLink}>
              Подробнее за месяц →
            </Link>
          </>
        )}
      </section>
    </>
  );
}
