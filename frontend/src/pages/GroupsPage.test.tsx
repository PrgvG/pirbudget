import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GroupsPage } from './GroupsPage';

const mockFetchPaymentGroups = vi.fn();
const mockCreatePaymentGroup = vi.fn();
const mockUpdatePaymentGroup = vi.fn();
const mockDeletePaymentGroup = vi.fn();

vi.mock('../domains/payment-groups', () => ({
  fetchPaymentGroups: (...args: unknown[]) => mockFetchPaymentGroups(...args),
  createPaymentGroup: (...args: unknown[]) => mockCreatePaymentGroup(...args),
  updatePaymentGroup: (...args: unknown[]) => mockUpdatePaymentGroup(...args),
  deletePaymentGroup: (...args: unknown[]) => mockDeletePaymentGroup(...args),
  isPaymentGroup: () => true,
  isPaymentGroupArray: () => true,
}));

vi.mock('@tanstack/react-router', async importOriginal => {
  const mod = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...mod,
    Link: ({ children, to }: { children: unknown; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

function renderGroupsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <GroupsPage />
    </QueryClientProvider>
  );
}

describe('GroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPaymentGroups.mockResolvedValue([]);
  });

  it('renders heading, back link and add button', async () => {
    renderGroupsPage();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /группы платежей/i })
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: /на главную/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /добавить группу/i })
    ).toBeInTheDocument();
  });

  it('shows list section and empty state when no groups', async () => {
    renderGroupsPage();
    await waitFor(() => {
      expect(
        screen.getByText(/групп пока нет\. добавьте первую/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/список групп/i)).toBeInTheDocument();
  });

  it('shows groups when fetch returns data', async () => {
    mockFetchPaymentGroups.mockResolvedValue([
      {
        id: '1',
        name: 'Продукты',
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);
    renderGroupsPage();
    await waitFor(() => {
      expect(screen.getByText('Продукты')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching', () => {
    mockFetchPaymentGroups.mockImplementation(() => new Promise(() => {}));
    renderGroupsPage();
    expect(screen.getByText(/загрузка/i)).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    mockFetchPaymentGroups.mockRejectedValue(new Error('Сетевая ошибка'));
    renderGroupsPage();
    await waitFor(() => {
      expect(screen.getByText(/сетевая ошибка/i)).toBeInTheDocument();
    });
  });

  it('shows form when Add group is clicked', async () => {
    renderGroupsPage();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /добавить группу/i })
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /добавить группу/i }));
    expect(
      screen.getByRole('heading', { name: /новая группа/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/название/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/порядок/i)).toBeInTheDocument();
    const submitButton = screen
      .getAllByRole('button')
      .find(el => el.getAttribute('type') === 'submit');
    expect(submitButton).toBeDefined();
    expect(submitButton).toHaveTextContent('Добавить');
  });
});
