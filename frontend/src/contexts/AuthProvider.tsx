import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getToken, removeToken, setToken } from '../lib/authStorage';
import { setOnUnauthorized } from '../api/client';
import { apiJson } from '../api/client';
import type { User } from '../types';
import { isUser } from '../types/guards';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
    return () => {
      setOnUnauthorized(null);
    };
  }, [logout]);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await apiJson('/api/auth/me', {}, isUser);
      setUser(me);
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((token: string, userData: User) => {
    setToken(token);
    setUser(userData);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
