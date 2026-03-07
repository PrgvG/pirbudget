import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
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
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>PirBudget</h1>
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
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
