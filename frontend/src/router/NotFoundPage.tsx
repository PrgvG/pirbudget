import { Link } from '@tanstack/react-router';
import { Button, Center, Stack, Text, Title } from '@mantine/core';

export function NotFoundPage() {
  return (
    <Center mih="60vh">
      <Stack align="center" gap="md">
        <Title order={1} c="dimmed">
          404
        </Title>
        <Text c="dimmed">Страница не найдена</Text>
        <Button component={Link} to="/" variant="light">
          На главную
        </Button>
      </Stack>
    </Center>
  );
}
