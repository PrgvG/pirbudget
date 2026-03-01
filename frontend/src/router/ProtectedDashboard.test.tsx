import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/useAuth';
import { ProtectedDashboard } from './ProtectedDashboard';

vi.mock('../pages/Dashboard', () => ({
  Dashboard: () => <div>Dashboard content</div>,
}));

function renderWithAuth(value: {
  isLoading: boolean;
  isAuthenticated: boolean;
}) {
  return render(
    <AuthContext.Provider
      value={{
        ...value,
        user: value.isAuthenticated
          ? {
              _id: '1',
              email: 'a@b.com',
              createdAt: '',
              updatedAt: '',
            }
          : null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      }}
    >
      <ProtectedDashboard />
    </AuthContext.Provider>
  );
}

describe('ProtectedDashboard', () => {
  it('shows loading when isLoading is true', () => {
    renderWithAuth({ isLoading: true, isAuthenticated: false });
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('renders nothing when not authenticated', () => {
    const { container } = renderWithAuth({
      isLoading: false,
      isAuthenticated: false,
    });
    expect(container.innerHTML).toBe('');
  });

  it('renders Dashboard when authenticated', () => {
    renderWithAuth({ isLoading: false, isAuthenticated: true });
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
  });
});
