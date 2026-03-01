import { useAuth } from '../contexts/useAuth';
import { Dashboard } from '../pages/Dashboard';

export function ProtectedDashboard() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Dashboard />;
}
