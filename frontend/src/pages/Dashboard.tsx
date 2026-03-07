import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../contexts/useAuth';
import { apiJson } from '../api/client';
import { isUsersResponse, isApiMessage } from '../types/guards';
import { HealthStatusBar, fetchHealth } from '../modules/health';
import type { DbStatus } from '../modules/health';
import styles from './Dashboard.module.css';

function useUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const data = await apiJson('/api/users', {}, isUsersResponse);
      return data.users;
    },
  });
}

function useApiMessageQuery() {
  return useQuery({
    queryKey: ['apiMessage'],
    queryFn: async () => {
      const data = await apiJson('/api', {}, isApiMessage);
      return data.message;
    },
  });
}

function useHealthQuery() {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const usersQuery = useUsersQuery();
  const messageQuery = useApiMessageQuery();
  const healthQuery = useHealthQuery();

  const dbStatus: DbStatus = healthQuery.isPending
    ? 'checking'
    : healthQuery.data?.database === 'connected'
      ? 'connected'
      : 'disconnected';

  const onRefresh = () => {
    usersQuery.refetch();
    messageQuery.refetch();
    healthQuery.refetch();
  };

  const loading = usersQuery.isPending;
  const error = usersQuery.error
    ? usersQuery.error instanceof Error
      ? usersQuery.error.message
      : 'Не удалось загрузить пользователей'
    : null;
  const users = usersQuery.data ?? [];
  const message = messageQuery.data ?? '';

  return (
    <div className="app">
      <div className={styles.header}>
        <h1>PirBudget</h1>
        <div className={styles.headerRight}>
          {user && (
            <span className={styles.userInfo}>
              {user.email}
              {user.name ? ` (${user.name})` : ''}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className={styles.logoutButton}
          >
            Выйти
          </button>
        </div>
      </div>
      <p>Учёт бюджета</p>

      <nav className={styles.nav}>
        <Link to="/groups" className={styles.navLink}>
          Группы платежей
        </Link>
        <Link to="/incomes" className={styles.navLink}>
          Поступления
        </Link>
      </nav>

      <HealthStatusBar dbStatus={dbStatus} onRefresh={onRefresh} />

      {message && <p>Backend message: {message}</p>}

      <div>
        <a
          href="http://localhost:8081"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mongoLink}
        >
          Открыть веб-морду MongoDB (Mongo Express)
        </a>
      </div>

      <div className={styles.usersSection}>
        <h2>Пользователи из MongoDB</h2>
        {loading && <p>Загрузка пользователей...</p>}
        {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}
        {!loading && !error && (
          <>
            {users.length === 0 ? (
              <p>Пользователей пока нет в базе данных</p>
            ) : (
              <ul className={styles.userList}>
                {users.map(u => (
                  <li key={u._id} className={styles.userCard}>
                    <strong>Email:</strong> {u.email}
                    {u.name && (
                      <>
                        <br />
                        <strong>Имя:</strong> {u.name}
                      </>
                    )}
                    <br />
                    <small className={styles.userMeta}>
                      Создан: {new Date(u.createdAt).toLocaleString('ru-RU')}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
