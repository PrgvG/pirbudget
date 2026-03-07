import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './Dashboard';

vi.mock('../domains/transactions', () => ({
  fetchMonthStats: vi.fn(() =>
    Promise.resolve({
      month: '2025-03',
      totalIncome: 100000,
      totalExpense: 45000,
      balance: 55000,
      expensesByGroup: [],
    })
  ),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...mod,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe('Dashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders welcome section and nav hint', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
    expect(
      screen.getByRole('heading', { name: /добро пожаловать в pirbudget/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/выберите раздел в меню внизу/i)
    ).toBeInTheDocument();
  });

  it('shows month stats when loaded', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
    expect(await screen.findByText(/55 000 ₽/)).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /подробнее за месяц/i })
    ).toHaveAttribute('href', '/month');
  });
});
