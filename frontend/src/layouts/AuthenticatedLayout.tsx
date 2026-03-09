import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import {
  AppShell,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Text,
} from '@mantine/core';
import { useAuth } from '../contexts/useAuth';
import { BottomNav } from '../components/BottomNav';

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
      <Center mih="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return (
      <Center mih="100vh">
        <Text c="dimmed">Перенаправление...</Text>
      </Center>
    );
  }

  return (
    <AppShell header={{ height: 56 }} footer={{ height: 96 }} padding="md">
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
              <Button variant="subtle" size="xs" onClick={logout}>
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

      <AppShell.Footer withBorder={false}>
        <Container
          size="xs"
          px="md"
          pb="xs"
          style={{
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <BottomNav />
        </Container>
      </AppShell.Footer>
    </AppShell>
  );
}
