import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getToken, setToken, removeToken } from './authStorage';

const storage: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => {
    storage[key] = value;
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
};

describe('authStorage', () => {
  beforeEach(() => {
    Object.keys(storage).forEach(key => delete storage[key]);
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  describe('getToken', () => {
    it('returns null when no token stored', () => {
      expect(getToken()).toBe(null);
    });

    it('returns token after setToken', () => {
      setToken('abc123');
      expect(getToken()).toBe('abc123');
    });
  });

  describe('removeToken', () => {
    it('clears token so getToken returns null', () => {
      setToken('t');
      removeToken();
      expect(getToken()).toBe(null);
    });
  });
});
