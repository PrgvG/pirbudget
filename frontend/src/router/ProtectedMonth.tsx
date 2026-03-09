import { Center, Loader } from '@mantine/core';
import { useAuth } from '../contexts/useAuth';
import { MonthPage } from '../pages/MonthPage';

export function ProtectedMonth() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <MonthPage />;
}
