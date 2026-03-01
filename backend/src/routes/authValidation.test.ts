import { describe, it, expect } from 'vitest';
import { validateRegisterBody, validateLoginBody } from './authValidation';

describe('validateRegisterBody', () => {
  it('returns error for non-object body', () => {
    expect(validateRegisterBody(null)).toEqual({
      ok: false,
      error: 'Invalid body',
      code: 'INVALID_BODY',
    });
    expect(validateRegisterBody('string')).toEqual({
      ok: false,
      error: 'Invalid body',
      code: 'INVALID_BODY',
    });
  });

  it('returns EMAIL_REQUIRED when email is empty', () => {
    expect(validateRegisterBody({})).toEqual({
      ok: false,
      error: 'Email is required',
      code: 'EMAIL_REQUIRED',
    });
    expect(
      validateRegisterBody({ email: '  ', password: 'password123' })
    ).toEqual({
      ok: false,
      error: 'Email is required',
      code: 'EMAIL_REQUIRED',
    });
  });

  it('returns INVALID_EMAIL for invalid email format', () => {
    expect(
      validateRegisterBody({ email: 'notanemail', password: 'password123' })
    ).toEqual({
      ok: false,
      error: 'Invalid email format',
      code: 'INVALID_EMAIL',
    });
    expect(
      validateRegisterBody({ email: 'a@', password: 'password123' })
    ).toEqual({
      ok: false,
      error: 'Invalid email format',
      code: 'INVALID_EMAIL',
    });
  });

  it('returns PASSWORD_REQUIRED when password is empty', () => {
    expect(validateRegisterBody({ email: 'a@b.com', password: '' })).toEqual({
      ok: false,
      error: 'Password is required',
      code: 'PASSWORD_REQUIRED',
    });
  });

  it('returns PASSWORD_TOO_SHORT when password is shorter than 8 chars', () => {
    expect(
      validateRegisterBody({ email: 'a@b.com', password: 'short' })
    ).toEqual({
      ok: false,
      error: 'Password must be at least 8 characters',
      code: 'PASSWORD_TOO_SHORT',
    });
  });

  it('returns valid data for correct input', () => {
    expect(
      validateRegisterBody({
        email: '  User@Example.COM  ',
        password: 'password123',
      })
    ).toEqual({
      ok: true,
      email: 'user@example.com',
      password: 'password123',
      name: undefined,
    });
  });

  it('trims and normalizes name when provided', () => {
    expect(
      validateRegisterBody({
        email: 'a@b.com',
        password: 'password123',
        name: '  John  ',
      })
    ).toEqual({
      ok: true,
      email: 'a@b.com',
      password: 'password123',
      name: 'John',
    });
  });

  it('converts empty name to undefined', () => {
    expect(
      validateRegisterBody({
        email: 'a@b.com',
        password: 'password123',
        name: '   ',
      })
    ).toEqual({
      ok: true,
      email: 'a@b.com',
      password: 'password123',
      name: undefined,
    });
  });
});

describe('validateLoginBody', () => {
  it('returns error for non-object body', () => {
    expect(validateLoginBody(null)).toEqual({
      ok: false,
      error: 'Invalid body',
      code: 'INVALID_BODY',
    });
  });

  it('returns INVALID_CREDENTIALS when email or password is empty', () => {
    expect(validateLoginBody({})).toEqual({
      ok: false,
      error: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
    });
    expect(validateLoginBody({ email: 'a@b.com' })).toEqual({
      ok: false,
      error: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
    });
    expect(validateLoginBody({ password: 'pass' })).toEqual({
      ok: false,
      error: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('returns valid data for correct input', () => {
    expect(
      validateLoginBody({
        email: '  User@Example.COM  ',
        password: 'mypassword',
      })
    ).toEqual({
      ok: true,
      email: 'user@example.com',
      password: 'mypassword',
    });
  });
});
