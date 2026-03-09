import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { AppShell, Button, Container, Group, Text } from '@mantine/core';
import { useAuth } from '../contexts/useAuth';
import { BottomNav } from '../components/BottomNav';
import styles from './AuthenticatedLayout.module.css';

export function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login', replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className={styles.loading} role="status" aria-label="Загрузка">
        Загрузка...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.loading} role="status" aria-label="Перенаправление">
        Перенаправление...
      </div>
    );
  }

  return (
    <AppShell
      header={{ height: 56 }}
      footer={{ height: 64 }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xs" h="100%">
          <Group justify="space-between" align="center" h="100%">
            <Text fw={700} size="lg">
              PirBudget
            </Text>
            <Group gap="xs">
              {user && (
                <Text size="xs" c="dimmed">
                  {user.email}
                  {user.name ? ` (${user.name})` : ''}
                </Text>
              )}
              <Button
                variant="subtle"
                size="xs"
                onClick={logout}
              >
                Выйти
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xs" pb={80}>
          <Outlet />
        </Container>
      </AppShell.Main>

      <AppShell.Footer>
        <BottomNav />
      </AppShell.Footer>
    </AppShell>
  );
}
