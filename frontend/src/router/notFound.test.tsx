import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotFoundPage } from './NotFoundPage';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('NotFoundPage', () => {
  it('shows "Страница не найдена" and link to main', () => {
    render(<NotFoundPage />);
    expect(screen.getByText(/Страница не найдена/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /На главную/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
