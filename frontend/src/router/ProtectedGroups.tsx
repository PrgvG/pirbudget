import { Center, Loader } from '@mantine/core';
import { useAuth } from '../contexts/useAuth';
import { CategoriesPage } from '../pages/CategoriesPage';

export function ProtectedCategories() {
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

  return <CategoriesPage />;
}
