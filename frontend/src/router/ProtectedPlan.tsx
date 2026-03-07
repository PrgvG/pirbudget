import { useAuth } from '../contexts/useAuth';
import { PlanPage } from '../pages/PlanPage';

export function ProtectedPlan() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <PlanPage />;
}
