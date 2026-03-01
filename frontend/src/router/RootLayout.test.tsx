import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RootLayout } from './RootLayout';

vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <div data-testid="outlet" />,
}));

describe('RootLayout', () => {
  it('renders Outlet without crashing', () => {
    render(<RootLayout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
