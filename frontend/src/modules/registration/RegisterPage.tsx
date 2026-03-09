import { useState } from 'react';
import { Alert, Button, PasswordInput, TextInput } from '@mantine/core';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '../../contexts/useAuth';
import { apiJson } from '../../api/client';
import { isAuthResponse } from '../../types/guards';
import styles from './Registration.module.css';

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
    <div className={styles.container}>
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <TextInput
            id="reg-email"
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
            id="reg-password"
            label="Пароль (не менее 8 символов)"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.currentTarget.value)
            }
            required
            disabled={submitting}
            autoComplete="new-password"
          />
        </div>
        <div className={styles.fieldGroup}>
          <TextInput
            id="reg-name"
            type="text"
            label="Имя (необязательно)"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.currentTarget.value)
            }
            disabled={submitting}
            autoComplete="name"
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
          className={styles.registerButton}
          fullWidth
        >
          {submitting ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
      </form>
      <p className={styles.footer}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
