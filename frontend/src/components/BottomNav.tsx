import { Link, useRouterState } from '@tanstack/react-router';
import styles from './BottomNav.module.css';

type NavItem = {
  to: string;
  label: string;
  icon: string;
};

const items: NavItem[] = [
  { to: '/', label: 'Главная', icon: '🏠' },
  { to: '/groups', label: 'Группы', icon: '📁' },
  { to: '/incomes', label: 'Поступления', icon: '💰' },
  { to: '/expenses', label: 'Платежи', icon: '💳' },
  { to: '/history', label: 'История', icon: '📋' },
  { to: '/plan', label: 'План', icon: '📅' },
  { to: '/stats', label: 'Статистика', icon: '📊' },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className={styles.nav} role="navigation" aria-label="Основное меню">
      {items.map(({ to, label, icon }) => {
        const isActive = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={isActive ? `${styles.link} ${styles.linkActive}` : styles.link}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.icon} aria-hidden>
              {icon}
            </span>
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
