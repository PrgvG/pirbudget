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
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '../../contexts/useAuth';
import { apiJson } from '../../api/client';
import { isAuthResponse } from '../../types/guards';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await apiJson(
        '/api/auth/register',
        {
          method: 'POST',
          body: {
            email: email.trim(),
            password,
            name: name.trim() || undefined,
          },
        },
        isAuthResponse
      );
      login(data.token, data.user);
      navigate({ to: '/', replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size={400} py="xl">
      <Title ta="center" order={2} mb="lg">
        Регистрация
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
              label="Пароль (не менее 8 символов)"
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              required
              disabled={submitting}
              autoComplete="new-password"
            />
            <TextInput
              label="Имя (необязательно)"
              value={name}
              onChange={e => setName(e.currentTarget.value)}
              disabled={submitting}
              autoComplete="name"
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
              Зарегистрироваться
            </Button>
          </Stack>
        </form>
      </Paper>
      <Text ta="center" mt="md" size="sm">
        Уже есть аккаунт?{' '}
        <Anchor component={Link} to="/login">
          Войти
        </Anchor>
      </Text>
    </Container>
  );
}
