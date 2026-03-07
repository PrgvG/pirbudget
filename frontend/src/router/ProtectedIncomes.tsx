import { useAuth } from '../contexts/useAuth';
import { IncomesPage } from '../pages/IncomesPage';

export function ProtectedIncomes() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <IncomesPage />;
}
