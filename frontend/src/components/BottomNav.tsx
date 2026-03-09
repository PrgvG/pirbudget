import { Link, useRouterState } from '@tanstack/react-router';
import { ActionIcon, Group, Paper, Text } from '@mantine/core';
import styles from './BottomNav.module.css';

type NavItem = {
  to: string;
  label: string;
  icon: string;
};

const items: NavItem[] = [
  { to: '/', label: 'Платежи и поступления', icon: '🏠' },
  { to: '/month', label: 'Месяц', icon: '📅' },
  { to: '/categories', label: 'Категории', icon: '📁' },
];

export function BottomNav() {
  const pathname = useRouterState({ select: s => s.location.pathname });

  return (
    <Paper
      component="nav"
      className={styles.nav}
      role="navigation"
      aria-label="Основное меню"
      shadow="md"
      withBorder
      radius={0}
    >
      <Group justify="space-around" gap="xs">
        {items.map(({ to, label, icon }) => {
          const isActive = pathname === to;

          return (
            <Link
              key={to}
              to={to}
              className={
                isActive ? `${styles.link} ${styles.linkActive}` : styles.link
              }
              aria-current={isActive ? 'page' : undefined}
            >
              <Group gap={2} align="center">
                <ActionIcon
                  variant={isActive ? 'filled' : 'subtle'}
                  color={isActive ? 'blue' : 'gray'}
                  size="lg"
                  aria-label={label}
                >
                  <span className={styles.icon} aria-hidden>
                    {icon}
                  </span>
                </ActionIcon>
                <Text
                  size="xs"
                  className={styles.label}
                  c={isActive ? 'blue' : 'dimmed'}
                >
                  {label}
                </Text>
              </Group>
            </Link>
          );
        })}
      </Group>
    </Paper>
  );
}
