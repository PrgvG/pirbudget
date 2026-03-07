import styles from './MonthPicker.module.css';

export type MonthPickerProps = {
  /** Текущий месяц YYYY-MM */
  month: string;
  /** Подпись месяца (например "март 2025") */
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onMonthChange: (value: string) => void;
  canPrev: boolean;
  canNext: boolean;
  /** Текст лейбла над блоком (например "Период") */
  label?: string;
  /** id для input type="month" (a11y) */
  id?: string;
};

export function MonthPicker({
  month,
  monthLabel,
  onPrev,
  onNext,
  onMonthChange,
  canPrev,
  canNext,
  label = 'Период',
  id = 'month-picker',
}: MonthPickerProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) onMonthChange(value.slice(0, 7));
  };

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className={styles.navButton}
          aria-label="Предыдущий месяц"
        >
          ←
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={styles.navButton}
          aria-label="Следующий месяц"
        >
          →
        </button>
        <input
          id={id}
          type="month"
          value={month}
          onChange={handleInputChange}
          className={styles.monthInput}
          aria-label="Выберите месяц"
        />
      </div>
    </div>
  );
}
