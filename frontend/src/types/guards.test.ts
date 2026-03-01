import { describe, it, expect } from 'vitest';
import {
  isAuthResponse,
  isUser,
  isUserArray,
  isApiMessage,
  hasFromPath,
  getFromPath,
} from './guards';

const validUser = {
  _id: 'id1',
  email: 'a@b.com',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('isAuthResponse', () => {
  it('returns true for valid AuthResponse', () => {
    expect(isAuthResponse({ token: 'x', user: validUser })).toBe(true);
  });

  it('returns false when token is missing', () => {
    expect(isAuthResponse({ user: validUser })).toBe(false);
  });

  it('returns false when user is missing', () => {
    expect(isAuthResponse({ token: 'x' })).toBe(false);
  });

  it('returns false when user is null', () => {
    expect(isAuthResponse({ token: 'x', user: null })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAuthResponse(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isAuthResponse('string')).toBe(false);
    expect(isAuthResponse(123)).toBe(false);
  });
});

describe('isUser', () => {
  it('returns true for valid User', () => {
    expect(isUser(validUser)).toBe(true);
  });

  it('returns true for User with optional name', () => {
    expect(isUser({ ...validUser, name: 'John' })).toBe(true);
  });

  it('returns false when _id is missing', () => {
    const { _id, ...rest } = validUser;
    expect(isUser(rest)).toBe(false);
  });

  it('returns false when email is missing', () => {
    const { email: _email, ...rest } = validUser;
    expect(isUser(rest)).toBe(false);
  });

  it('returns false when createdAt is missing', () => {
    const { createdAt: _createdAt, ...rest } = validUser;
    expect(isUser(rest)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUser(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isUser([])).toBe(false);
  });
});

describe('isUserArray', () => {
  it('returns true for empty array', () => {
    expect(isUserArray([])).toBe(true);
  });

  it('returns true for array of valid users', () => {
    expect(isUserArray([validUser, { ...validUser, _id: 'id2' }])).toBe(true);
  });

  it('returns false when one element is invalid', () => {
    expect(isUserArray([validUser, { _id: 'x' }])).toBe(false);
  });

  it('returns false for non-array', () => {
    expect(isUserArray(null)).toBe(false);
    expect(isUserArray({})).toBe(false);
  });
});

describe('isApiMessage', () => {
  it('returns true for object with string message', () => {
    expect(isApiMessage({ message: 'hello' })).toBe(true);
  });

  it('returns false when message is not a string', () => {
    expect(isApiMessage({ message: 123 })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isApiMessage(null)).toBe(false);
  });

  it('returns false for object without message', () => {
    expect(isApiMessage({})).toBe(false);
  });
});

describe('hasFromPath', () => {
  it('returns true for undefined or null', () => {
    expect(hasFromPath(undefined)).toBe(true);
    expect(hasFromPath(null)).toBe(true);
  });

  it('returns true for object without from', () => {
    expect(hasFromPath({})).toBe(true);
  });

  it('returns true for object with from null', () => {
    expect(hasFromPath({ from: null })).toBe(true);
  });

  it('returns true for object with from.pathname string', () => {
    expect(hasFromPath({ from: { pathname: '/x' } })).toBe(true);
  });

  it('returns false when from is object but pathname is not string', () => {
    expect(hasFromPath({ from: {} })).toBe(false);
    expect(hasFromPath({ from: { pathname: 123 } })).toBe(false);
  });
});

describe('getFromPath', () => {
  it('returns "/" when no from or pathname', () => {
    expect(getFromPath(undefined)).toBe('/');
    expect(getFromPath({})).toBe('/');
    expect(getFromPath({ from: {} })).toBe('/');
  });

  it('returns pathname when state.from.pathname is present', () => {
    expect(getFromPath({ from: { pathname: '/dashboard' } })).toBe(
      '/dashboard'
    );
  });
});
