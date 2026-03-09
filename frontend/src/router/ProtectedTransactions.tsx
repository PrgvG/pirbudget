import { Center, Loader } from '@mantine/core';
import { useAuth } from '../contexts/useAuth';
import { TransactionsPage } from '../pages/TransactionsPage';

export function ProtectedTransactions() {
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

  return <TransactionsPage />;
}
