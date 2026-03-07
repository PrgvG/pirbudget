import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { PlannedItem } from 'shared';
import type { PaymentGroup } from 'shared/payment-groups';
import { fetchPlan, type PlanParams } from '../domains/transactions';
import { fetchPaymentGroups } from '../domains/payment-groups';
import { useMonthPicker, MonthPicker } from '../components/month-picker';
import styles from './PlanPage.module.css';

const PLAN_QUERY_KEY = 'plan';
const GROUPS_QUERY_KEY = ['payment-groups'] as const;

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

function groupByDate(items: PlannedItem[]): Map<string, PlannedItem[]> {
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

export function PlanPage() {
  const monthPicker = useMonthPicker();

  const planParams: PlanParams = useMemo(
    () => ({ from: monthPicker.from, to: monthPicker.to }),
    [monthPicker.from, monthPicker.to]
  );

  const planQuery = useQuery({
    queryKey: [PLAN_QUERY_KEY, planParams],
    queryFn: () => fetchPlan(planParams),
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

  const items = planQuery.data ?? [];
  const byDate = useMemo(() => groupByDate(items), [items]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>План</h1>
        <Link to="/" className={styles.backLink}>
          На главную
        </Link>
      </header>

      <section className={styles.filters}>
        <div className={styles.filterGroup}>
          <MonthPicker
            id="plan-month"
            month={monthPicker.month}
            monthLabel={monthPicker.monthLabel}
            onPrev={monthPicker.handlePrevMonth}
            onNext={monthPicker.handleNextMonth}
            onMonthChange={monthPicker.handleMonthChange}
            canPrev={monthPicker.canPrev}
            canNext={monthPicker.canNext}
          />
        </div>
      </section>

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
      {!planQuery.isPending && !planQuery.error && items.length === 0 && (
        <p className={styles.empty}>
          На выбранный период запланированных платежей нет.
        </p>
      )}
      {!planQuery.isPending && !planQuery.error && byDate.size > 0 && (
        <div className={styles.dateSection}>
          {Array.from(byDate.entries()).map(([dateKey, list]) => (
            <div key={dateKey}>
              <h2 className={styles.dateHeading}>
                {formatDateLabel(dateKey)}
              </h2>
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
    </div>
  );
}

type PlannedItemCardProps = {
  item: PlannedItem;
  groupName?: string;
};

function PlannedItemCard({ item, groupName }: PlannedItemCardProps) {
  const typeLabel = item.kind === 'recurring' ? 'Повторяющийся' : 'Разовый';

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
