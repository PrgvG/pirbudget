import { ActionIcon, Group, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

export type MonthPickerProps = {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  label?: string;
  id?: string;
};

export function MonthPicker({
  monthLabel,
  onPrev,
  onNext,
  canPrev,
  canNext,
  label = 'Период',
}: MonthPickerProps) {
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
      </Group>
    </div>
  );
}
