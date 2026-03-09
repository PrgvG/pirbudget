import { Alert, Button, Group } from '@mantine/core';
import { IconCircleFilled, IconRefresh } from '@tabler/icons-react';
import type { DbStatus } from './types';

type HealthStatusBarProps = {
  dbStatus: DbStatus;
  onRefresh: () => void;
};

const alertColor: Record<DbStatus, string> = {
  connected: 'green',
  disconnected: 'red',
  checking: 'yellow',
};

const statusLabel: Record<DbStatus, string> = {
  connected: 'Подключен',
  disconnected: 'Отключен',
  checking: 'Проверка...',
};

export function HealthStatusBar({ dbStatus, onRefresh }: HealthStatusBarProps) {
  return (
    <Alert
      color={alertColor[dbStatus]}
      variant="light"
      radius="md"
      mb="sm"
      p="xs"
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="xs" align="center" wrap="nowrap">
          <IconCircleFilled size={10} />
          <span>MongoDB: {statusLabel[dbStatus]}</span>
        </Group>
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={onRefresh}
          leftSection={<IconRefresh size={14} />}
        >
          Обновить
        </Button>
      </Group>
    </Alert>
  );
}
