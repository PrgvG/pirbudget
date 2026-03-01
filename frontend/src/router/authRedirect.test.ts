import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shouldRedirectToLogin } from './authRedirect';

const mockGetToken = vi.fn();

vi.mock('../lib/authStorage', () => ({
  getToken: () => mockGetToken(),
}));

describe('shouldRedirectToLogin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when getToken returns null', () => {
    mockGetToken.mockReturnValue(null);
    expect(shouldRedirectToLogin()).toBe(true);
  });

  it('returns false when getToken returns a string', () => {
    mockGetToken.mockReturnValue('some-token');
    expect(shouldRedirectToLogin()).toBe(false);
  });
});
