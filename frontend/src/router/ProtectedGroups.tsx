import { useAuth } from '../contexts/useAuth';
import { GroupsPage } from '../pages/GroupsPage';

export function ProtectedGroups() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <GroupsPage />;
}
