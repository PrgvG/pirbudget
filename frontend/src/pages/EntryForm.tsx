import type { RecurrenceByInterval, RecurrenceByDate } from 'shared/recurrence';
import styles from './TransactionsPage.module.css';

type UnifiedFormState = {
  direction: 'income' | 'expense';
  schedule: 'date' | 'interval';
  amount: number;
  note: string;
  categoryId: string;
  date: string;
  unit: 'day' | 'week' | 'month' | 'year';
  interval: string;
  anchorDate: string;
  endDate: string;
  repeatCount: string;
  recurrenceDate: string;
};

type EditingType = 'entry' | 'recurringExpense' | 'recurringIncome' | null;

type EntryFormCategory = {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
};

type EntryFormProps = {
  value: UnifiedFormState;
  onChange: (next: UnifiedFormState) => void;
  editingType: EditingType;
  categories: EntryFormCategory[];
  error: string | null;
  intervalError: string | null;
  isPending: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
};

export function EntryForm({
  value,
  onChange,
  editingType,
  categories,
  error,
  intervalError,
  isPending,
  onSubmit,
  onCancel,
}: EntryFormProps) {
  const handleDirectionChange = (direction: UnifiedFormState['direction']) => {
    onChange({ ...value, direction, categoryId: '' });
  };

  const handleScheduleChange = (schedule: UnifiedFormState['schedule']) => {
    onChange({ ...value, schedule });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, date: event.target.value });
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextAmount = parseFloat(event.target.value) || 0;
    onChange({ ...value, amount: nextAmount });
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, categoryId: event.target.value });
  };

  const handleUnitChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    onChange({
      ...value,
      unit: event.target.value as UnifiedFormState['unit'],
    });
  };

  const handleIntervalChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value;
    if (nextValue === '') {
      onChange({ ...value, interval: '' });
      return;
    }
    onChange({ ...value, interval: nextValue });
  };

  const handleAnchorDateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({ ...value, anchorDate: event.target.value });
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, endDate: event.target.value });
  };

  const handleRepeatCountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({ ...value, repeatCount: event.target.value });
  };

  const handleNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, note: event.target.value });
  };

  const isIntervalSchedule = value.schedule === 'interval';

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <h2 className={styles.formTitle}>
        {editingType ? 'Редактировать запись' : 'Новая запись'}
      </h2>
      <div className={styles.field}>
        <span className={styles.label}>Тип</span>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="unified-direction"
              checked={value.direction === 'income'}
              onChange={() => handleDirectionChange('income')}
              disabled={!!editingType}
            />
            Доход
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="unified-direction"
              checked={value.direction === 'expense'}
              onChange={() => handleDirectionChange('expense')}
              disabled={!!editingType}
            />
            Расход
          </label>
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Повторение</span>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="unified-schedule"
              checked={value.schedule === 'date'}
              onChange={() => handleScheduleChange('date')}
              disabled={!!editingType}
            />
            Одна дата
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="unified-schedule"
              checked={value.schedule === 'interval'}
              onChange={() => handleScheduleChange('interval')}
              disabled={!!editingType}
            />
            По интервалу
          </label>
        </div>
      </div>
      {value.schedule === 'date' ? (
        <div className={styles.field}>
          <label htmlFor="unified-date" className={styles.label}>
            Дата
          </label>
          <input
            id="unified-date"
            type="date"
            value={value.date}
            onChange={handleDateChange}
            className={styles.input}
          />
        </div>
      ) : null}
      <div className={styles.field}>
        <label htmlFor="unified-amount" className={styles.label}>
          Сумма
          {isIntervalSchedule ? ' за одно вхождение' : ''}
        </label>
        <input
          id="unified-amount"
          type="number"
          min={0}
          step={0.01}
          value={value.amount || ''}
          onChange={handleAmountChange}
          placeholder="0"
          className={styles.input}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="unified-category" className={styles.label}>
          Категория
        </label>
        <select
          id="unified-category"
          className={styles.select}
          value={value.categoryId}
          onChange={handleCategoryChange}
        >
          <option value="">— Выберите категорию —</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon ? `${category.icon} ` : ''}
              {category.name}
            </option>
          ))}
        </select>
      </div>
      {isIntervalSchedule ? (
        <>
          <div className={styles.field}>
            <label htmlFor="unified-unit" className={styles.label}>
              Единица
            </label>
            <select
              id="unified-unit"
              className={styles.select}
              value={value.unit}
              onChange={handleUnitChange}
            >
              <option value="day">День</option>
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
              <option value="year">Год</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="unified-interval" className={styles.label}>
              Каждые (число)
            </label>
            <input
              id="unified-interval"
              type="number"
              min={1}
              value={value.interval}
              onChange={handleIntervalChange}
              className={
                intervalError
                  ? `${styles.input} ${styles.inputError}`
                  : styles.input
              }
            />
            {intervalError ? (
              <p className={styles.error}>{intervalError}</p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="unified-anchorDate" className={styles.label}>
              Дата начала
            </label>
            <input
              id="unified-anchorDate"
              type="date"
              value={value.anchorDate}
              onChange={handleAnchorDateChange}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="unified-endDate" className={styles.label}>
              Дата окончания (необязательно)
            </label>
            <input
              id="unified-endDate"
              type="date"
              value={value.endDate}
              onChange={handleEndDateChange}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="unified-repeatCount" className={styles.label}>
              Количество повторов (пусто = бесконечно)
            </label>
            <input
              id="unified-repeatCount"
              type="number"
              min={0}
              value={value.repeatCount}
              onChange={handleRepeatCountChange}
              className={styles.input}
              placeholder="Пусто — без ограничения"
            />
          </div>
        </>
      ) : null}
      <div className={styles.field}>
        <label htmlFor="unified-note" className={styles.label}>
          Примечание (опционально)
        </label>
        <input
          id="unified-note"
          type="text"
          value={value.note}
          onChange={handleNoteChange}
          className={styles.input}
        />
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.formActions}>
        <button
          type="submit"
          disabled={isPending}
          className={styles.submitButton}
        >
          {editingType ? 'Сохранить' : 'Добавить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

