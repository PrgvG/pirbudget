import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import type { User } from '../types';

const mockGetToken = vi.fn();
const mockSetToken = vi.fn();
const mockRemoveToken = vi.fn();
const mockApiJson = vi.fn();
const mockSetOnUnauthorized = vi.fn();

vi.mock('../lib/authStorage', () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
  setToken: (...args: unknown[]) => mockSetToken(...args),
  removeToken: (...args: unknown[]) => mockRemoveToken(...args),
}));

vi.mock('../api/client', () => ({
  apiJson: (...args: unknown[]) => mockApiJson(...args),
  setOnUnauthorized: (...args: unknown[]) => mockSetOnUnauthorized(...args),
}));

const testUser: User = {
  _id: '1',
  email: 'test@example.com',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockReturnValue(null);
  });

  it('sets isLoading to false and user to null when no token exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('fetches user from /api/auth/me when token exists', async () => {
    mockGetToken.mockReturnValue('valid-token');
    mockApiJson.mockResolvedValue(testUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual(testUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockApiJson).toHaveBeenCalledWith(
      '/api/auth/me',
      {},
      expect.any(Function)
    );
  });

  it('clears token and sets user to null when /api/auth/me fails', async () => {
    mockGetToken.mockReturnValue('bad-token');
    mockApiJson.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(mockRemoveToken).toHaveBeenCalled();
  });

  it('login() saves token and sets user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.login('new-token', testUser);
    });

    expect(mockSetToken).toHaveBeenCalledWith('new-token');
    expect(result.current.user).toEqual(testUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logout() removes token and clears user', async () => {
    mockGetToken.mockReturnValue('valid-token');
    mockApiJson.mockResolvedValue(testUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(testUser));

    act(() => {
      result.current.logout();
    });

    expect(mockRemoveToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('registers setOnUnauthorized callback on mount', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockSetOnUnauthorized).toHaveBeenCalledWith(expect.any(Function));
  });
});
