import { ActionIcon, Group, Text } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';

export type MonthPickerProps = {
  month: string;
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onMonthChange: (value: string) => void;
  canPrev: boolean;
  canNext: boolean;
  label?: string;
  id?: string;
};

function monthStrToDate(m: string): Date {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1);
}

function dateToMonthStr(d: Date): string {
  return dayjs(d).format('YYYY-MM');
}

export function MonthPicker({
  month,
  monthLabel,
  onPrev,
  onNext,
  onMonthChange,
  canPrev,
  canNext,
  label = 'Период',
}: MonthPickerProps) {
  const handlePickerChange = (value: Date | null) => {
    if (value) onMonthChange(dateToMonthStr(value));
  };

  return (
    <div>
      <Text size="xs" fw={500} c="dimmed" mb={4}>
        {label}
      </Text>
      <Group gap="sm" align="center">
        <ActionIcon
          variant="default"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Предыдущий месяц"
          size="lg"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>

        <Text fw={500} ta="center" miw={140}>
          {monthLabel}
        </Text>

        <ActionIcon
          variant="default"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Следующий месяц"
          size="lg"
        >
          <IconChevronRight size={18} />
        </ActionIcon>

        <MonthPickerInput
          value={monthStrToDate(month)}
          onChange={handlePickerChange}
          aria-label="Выберите месяц"
          size="sm"
          w={160}
          valueFormat="MMMM YYYY"
        />
      </Group>
    </div>
  );
}
