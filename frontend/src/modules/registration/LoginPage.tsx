import { useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useNavigate, useRouterState, Link } from '@tanstack/react-router';
import { useAuth } from '../../contexts/useAuth';
import { apiJson } from '../../api/client';
import { getFromPath, isAuthResponse } from '../../types/guards';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: s => s.location });
  const from = getFromPath(location.state);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await apiJson(
        '/api/auth/login',
        {
          method: 'POST',
          body: { email: email.trim(), password },
        },
        isAuthResponse
      );
      login(data.token, data.user);
      navigate({ to: from, replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Неверный email или пароль'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size={400} py="xl">
      <Title ta="center" order={2} mb="lg">
        Вход
      </Title>
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <TextInput
              type="email"
              label="Email"
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              required
              disabled={submitting}
              autoComplete="email"
            />
            <PasswordInput
              label="Пароль"
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              required
              disabled={submitting}
              autoComplete="current-password"
            />
            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              loading={submitting}
            >
              Войти
            </Button>
          </Stack>
        </form>
      </Paper>
      <Text ta="center" mt="md" size="sm">
        Нет аккаунта?{' '}
        <Anchor component={Link} to="/register">
          Зарегистрироваться
        </Anchor>
      </Text>
    </Container>
  );
}
