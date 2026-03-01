import { describe, it, expect } from 'vitest';
import { AppError, isAppError } from './errors';

describe('AppError', () => {
  it('creates error with default statusCode 500 and undefined code', () => {
    const err = new AppError('something went wrong');
    expect(err.message).toBe('something went wrong');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBeUndefined();
    expect(err.name).toBe('AppError');
  });

  it('accepts custom statusCode and code', () => {
    const err = new AppError('not found', {
      statusCode: 404,
      code: 'NOT_FOUND',
    });
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('is instanceof Error', () => {
    const err = new AppError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('isAppError', () => {
  it('returns true for AppError', () => {
    expect(isAppError(new AppError('x'))).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isAppError(new Error('x'))).toBe(false);
  });

  it('returns false for null and string', () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError('error string')).toBe(false);
  });
});
