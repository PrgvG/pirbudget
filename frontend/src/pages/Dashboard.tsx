import styles from './Dashboard.module.css';

export function Dashboard() {
  return (
    <section className={styles.welcome}>
      <h2>Добро пожаловать в PirBudget</h2>
      <p>
        Учёт бюджета: группы платежей, поступления, обязательные платежи,
        история операций, план и статистика за месяц.
      </p>
      <p className={styles.navHint}>
        Выберите раздел в меню внизу.
      </p>
    </section>
  );
}
