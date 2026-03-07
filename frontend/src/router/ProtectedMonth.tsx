import { useAuth } from '../contexts/useAuth';
import { MonthPage } from '../pages/MonthPage';

export function ProtectedMonth() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <MonthPage />;
}
