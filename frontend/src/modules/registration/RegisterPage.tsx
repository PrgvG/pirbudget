import { useState } from 'react';
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
          <label htmlFor="reg-email" className={styles.label}>
            Email
          </label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-password" className={styles.label}>
            Пароль (не менее 8 символов)
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={submitting}
            autoComplete="new-password"
            className={styles.input}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="reg-name" className={styles.label}>
            Имя (необязательно)
          </label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={submitting}
            autoComplete="name"
            className={styles.input}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          className={styles.registerButton}
        >
          {submitting ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
      <p className={styles.footer}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
