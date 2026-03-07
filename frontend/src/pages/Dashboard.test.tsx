import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
  it('renders welcome section and nav hint', () => {
    render(<Dashboard />);
    expect(
      screen.getByRole('heading', { name: /добро пожаловать в pirbudget/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/выберите раздел в меню внизу/i)
    ).toBeInTheDocument();
  });
});
