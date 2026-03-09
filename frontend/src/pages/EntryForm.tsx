import type { RecurrenceByInterval, RecurrenceByDate } from 'shared/recurrence';
import {
  Alert,
  Button,
  NumberInput,
  SegmentedControl,
  Select,
  TextInput,
} from '@mantine/core';
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
        <SegmentedControl
          value={value.direction}
          onChange={next =>
            handleDirectionChange(
              next as UnifiedFormState['direction'],
            )
          }
          data={[
            { label: 'Доход', value: 'income' },
            { label: 'Расход', value: 'expense' },
          ]}
          disabled={!!editingType}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Повторение</span>
        <SegmentedControl
          value={value.schedule}
          onChange={next =>
            handleScheduleChange(
              next as UnifiedFormState['schedule'],
            )
          }
          data={[
            { label: 'Одна дата', value: 'date' },
            { label: 'По интервалу', value: 'interval' },
          ]}
          disabled={!!editingType}
        />
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
        <NumberInput
          id="unified-amount"
          min={0}
          step={0.01}
          value={value.amount}
          onChange={(next: string | number | null) => {
            const numeric =
              typeof next === 'number'
                ? next
                : parseFloat(String(next ?? '')) || 0;
            onChange({ ...value, amount: numeric });
          }}
          placeholder="0"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="unified-category" className={styles.label}>
          Категория
        </label>
        <Select
          id="unified-category"
          placeholder="— Выберите категорию —"
          value={value.categoryId || null}
          onChange={(next: string | null) =>
            onChange({ ...value, categoryId: next ?? '' })
          }
          data={categories.map(category => ({
            value: category.id,
            label: `${category.icon ? `${category.icon} ` : ''}${
              category.name
            }`,
          }))}
        />
      </div>
      {isIntervalSchedule ? (
        <>
          <div className={styles.field}>
            <label htmlFor="unified-unit" className={styles.label}>
              Единица
            </label>
            <Select
              id="unified-unit"
              value={value.unit}
              onChange={(next: string | null) => {
                if (!next) {
                  return;
                }
                onChange({
                  ...value,
                  unit: next as UnifiedFormState['unit'],
                });
              }}
              data={[
                { value: 'day', label: 'День' },
                { value: 'week', label: 'Неделя' },
                { value: 'month', label: 'Месяц' },
                { value: 'year', label: 'Год' },
              ]}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="unified-interval" className={styles.label}>
              Каждые (число)
            </label>
            <NumberInput
              id="unified-interval"
              min={1}
              value={
                value.interval === ''
                  ? undefined
                  : Number(value.interval)
              }
              onChange={(next: string | number | null) => {
                if (next === '' || next === null) {
                  onChange({ ...value, interval: '' });
                  return;
                }
                onChange({
                  ...value,
                  interval: String(next),
                });
              }}
              error={intervalError || undefined}
            />
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
            <NumberInput
              id="unified-repeatCount"
              min={0}
              value={
                value.repeatCount === ''
                  ? undefined
                  : Number(value.repeatCount)
              }
              onChange={(next: string | number | null) => {
                if (next === '' || next === null) {
                  onChange({ ...value, repeatCount: '' });
                  return;
                }
                onChange({
                  ...value,
                  repeatCount: String(next),
                });
              }}
              placeholder="Пусто — без ограничения"
            />
          </div>
        </>
      ) : null}
      <div className={styles.field}>
        <TextInput
          id="unified-note"
          label="Примечание (опционально)"
          value={value.note}
          onChange={handleNoteChange}
        />
      </div>
      {error ? (
        <Alert color="red" title="Ошибка">
          {error}
        </Alert>
      ) : null}
      <div className={styles.formActions}>
        <Button
          type="submit"
          disabled={isPending}
          className={styles.submitButton}
        >
          {editingType ? 'Сохранить' : 'Добавить'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className={styles.cancelButton}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}

