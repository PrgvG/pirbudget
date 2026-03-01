import { useState } from 'react';
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
          <label htmlFor="login-email" className={styles.label}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={submitting}
            autoComplete="email"
            className={styles.input}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="login-password" className={styles.label}>
            Пароль
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={submitting}
            autoComplete="current-password"
            className={styles.input}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          className={styles.loginButton}
        >
          {submitting ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p className={styles.footer}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
