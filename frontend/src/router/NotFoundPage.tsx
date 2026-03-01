import { Link } from '@tanstack/react-router';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.container}>
      <p>Страница не найдена</p>
      <Link to="/">На главную</Link>
    </div>
  );
}
