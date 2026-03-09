import { useState } from 'react';
import { Alert, Button, PasswordInput, TextInput } from '@mantine/core';
import { useNavigate, useRouterState, Link } from '@tanstack/react-router';
import { useAuth } from '../../contexts/useAuth';
import { apiJson } from '../../api/client';
import { getFromPath, isAuthResponse } from '../../types/guards';
import styles from './Registration.module.css';

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
    <div className={styles.container}>
      <h1>Вход</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <TextInput
            id="login-email"
            type="email"
            label="Email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.currentTarget.value)
            }
            required
            disabled={submitting}
            autoComplete="email"
          />
        </div>
        <div className={styles.fieldGroup}>
          <PasswordInput
            id="login-password"
            label="Пароль"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.currentTarget.value)
            }
            required
            disabled={submitting}
            autoComplete="current-password"
          />
        </div>
        {error && (
          <Alert color="red" variant="light" className={styles.error}>
            {error}
          </Alert>
        )}
        <Button
          type="submit"
          disabled={submitting}
          loading={submitting}
          className={styles.loginButton}
          fullWidth
        >
          {submitting ? 'Вход...' : 'Войти'}
        </Button>
      </form>
      <p className={styles.footer}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
