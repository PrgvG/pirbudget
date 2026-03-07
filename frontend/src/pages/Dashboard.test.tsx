import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../contexts/useAuth';
import { Dashboard } from './Dashboard';

vi.mock('../api/client', () => ({
  apiJson: vi.fn(() =>
    Promise.resolve({ users: [], total: 0, page: 1, limit: 20 })
  ),
}));

vi.mock('../modules/health', () => ({
  fetchHealth: vi.fn(() =>
    Promise.resolve({ status: 'ok', message: 'OK', database: 'connected' })
  ),
  HealthStatusBar: ({ dbStatus }: { dbStatus: string }) => (
    <div data-testid="health-bar">{dbStatus}</div>
  ),
}));

vi.mock('@tanstack/react-router', async importOriginal => {
  const mod = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...mod,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: 'Hello' }),
  })
);

describe('Dashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders heading and uses queries', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user: {
              _id: '1',
              email: 'a@b.com',
              createdAt: '',
              updatedAt: '',
            },
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
          }}
        >
          <Dashboard />
        </AuthContext.Provider>
      </QueryClientProvider>
    );
    await screen.findByRole('heading', { name: /pirbudget/i });
    expect(
      screen.getByRole('heading', { name: /pirbudget/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('health-bar')).toBeInTheDocument();
  });
});
