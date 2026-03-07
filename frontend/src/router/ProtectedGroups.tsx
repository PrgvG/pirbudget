import { useAuth } from '../contexts/useAuth';
import { CategoriesPage } from '../pages/CategoriesPage';

export function ProtectedCategories() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <CategoriesPage />;
}
