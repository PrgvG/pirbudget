import type { DbStatus } from './types';
import styles from './HealthStatusBar.module.css';

type HealthStatusBarProps = {
  dbStatus: DbStatus;
  onRefresh: () => void;
};

const barClass: Record<DbStatus, string> = {
  connected: styles.connected,
  disconnected: styles.disconnected,
  checking: styles.checking,
};

const dotClass: Record<DbStatus, string> = {
  connected: styles.dotConnected,
  disconnected: styles.dotDisconnected,
  checking: styles.dotChecking,
};

const statusLabel: Record<DbStatus, string> = {
  connected: 'Подключен',
  disconnected: 'Отключен',
  checking: 'Проверка...',
};

export function HealthStatusBar({ dbStatus, onRefresh }: HealthStatusBarProps) {
  return (
    <div className={barClass[dbStatus]}>
      <span className={dotClass[dbStatus]} />
      <span>MongoDB: {statusLabel[dbStatus]}</span>
      <button
        type="button"
        onClick={onRefresh}
        className={styles.refreshButton}
      >
        Обновить
      </button>
    </div>
  );
}
