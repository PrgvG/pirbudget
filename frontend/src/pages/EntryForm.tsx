import {
  Alert,
  Button,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';

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

function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateToIso(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  const isIntervalSchedule = value.schedule === 'interval';

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="sm">
        <div>
          <SegmentedControl
            fullWidth
            value={value.direction}
            onChange={next =>
              onChange({
                ...value,
                direction: next as UnifiedFormState['direction'],
                categoryId: '',
              })
            }
            data={[
              { label: 'Доход', value: 'income' },
              { label: 'Расход', value: 'expense' },
            ]}
            disabled={!!editingType}
          />
        </div>

        <div>
          <SegmentedControl
            fullWidth
            value={value.schedule}
            onChange={next =>
              onChange({
                ...value,
                schedule: next as UnifiedFormState['schedule'],
              })
            }
            data={[
              { label: 'Одна дата', value: 'date' },
              { label: 'По интервалу', value: 'interval' },
            ]}
            disabled={!!editingType}
          />
        </div>

        {value.schedule === 'date' ? (
          <DateInput
            label="Дата"
            value={isoToDate(value.date)}
            onChange={d => onChange({ ...value, date: dateToIso(d) })}
            valueFormat="DD.MM.YYYY"
            clearable
          />
        ) : null}

        <NumberInput
          label={`Сумма${isIntervalSchedule ? ' за одно вхождение' : ''}`}
          min={0}
          step={0.01}
          value={value.amount}
          inputMode="decimal"
          onChange={(next: string | number) => {
            const numeric =
              typeof next === 'number' ? next : parseFloat(String(next)) || 0;
            onChange({ ...value, amount: numeric });
          }}
          placeholder="0"
        />

        <Select
          label="Категория"
          placeholder="— Выберите категорию —"
          value={value.categoryId || null}
          onChange={(next: string | null) =>
            onChange({ ...value, categoryId: next ?? '' })
          }
          data={categories.map(category => ({
            value: category.id,
            label: `${category.icon ? `${category.icon} ` : ''}${category.name}`,
          }))}
        />

        {isIntervalSchedule ? (
          <>
            <Select
              label="Единица"
              value={value.unit}
              onChange={(next: string | null) => {
                if (!next) return;
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

            <NumberInput
              label="Каждые (число)"
              min={1}
              inputMode="numeric"
              value={value.interval === '' ? undefined : Number(value.interval)}
              onChange={(next: string | number) => {
                if (next === '' || next === null) {
                  onChange({ ...value, interval: '' });
                  return;
                }
                onChange({ ...value, interval: String(next) });
              }}
              error={intervalError || undefined}
            />

            <DateInput
              label="Дата начала"
              value={isoToDate(value.anchorDate)}
              onChange={d => onChange({ ...value, anchorDate: dateToIso(d) })}
              valueFormat="DD.MM.YYYY"
              clearable
            />

            <DateInput
              label="Дата окончания (необязательно)"
              value={isoToDate(value.endDate)}
              onChange={d => onChange({ ...value, endDate: dateToIso(d) })}
              valueFormat="DD.MM.YYYY"
              clearable
            />

            <NumberInput
              label="Количество повторов (пусто = бесконечно)"
              min={0}
              value={
                value.repeatCount === '' ? undefined : Number(value.repeatCount)
              }
              onChange={(next: string | number) => {
                if (next === '' || next === null) {
                  onChange({ ...value, repeatCount: '' });
                  return;
                }
                onChange({ ...value, repeatCount: String(next) });
              }}
              placeholder="Пусто — без ограничения"
            />
          </>
        ) : null}

        <TextInput
          label="Примечание (опционально)"
          value={value.note}
          onChange={e => onChange({ ...value, note: e.currentTarget.value })}
        />

        {error ? (
          <Alert color="red" title="Ошибка">
            {error}
          </Alert>
        ) : null}

        <Group gap="sm" mt="xs">
          <Button type="submit" loading={isPending}>
            {editingType ? 'Сохранить' : 'Добавить'}
          </Button>
          <Button type="button" variant="default" onClick={onCancel}>
            Отмена
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
