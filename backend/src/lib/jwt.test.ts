import { describe, it, expect } from 'vitest';
import { parseExpiresIn } from './jwt';

describe('parseExpiresIn', () => {
  it('parses numeric string as number', () => {
    expect(parseExpiresIn('3600')).toBe(3600);
    expect(parseExpiresIn('0')).toBe(0);
  });

  it('passes valid duration strings through', () => {
    expect(parseExpiresIn('7d')).toBe('7d');
    expect(parseExpiresIn('24h')).toBe('24h');
    expect(parseExpiresIn('30m')).toBe('30m');
    expect(parseExpiresIn('60s')).toBe('60s');
    expect(parseExpiresIn('1w')).toBe('1w');
    expect(parseExpiresIn('1y')).toBe('1y');
  });

  it('throws on invalid format', () => {
    expect(() => parseExpiresIn('abc')).toThrow(
      'Invalid JWT_EXPIRES_IN format'
    );
    expect(() => parseExpiresIn('7x')).toThrow(
      'Invalid JWT_EXPIRES_IN format'
    );
    expect(() => parseExpiresIn('')).toThrow('Invalid JWT_EXPIRES_IN format');
    expect(() => parseExpiresIn('d7')).toThrow(
      'Invalid JWT_EXPIRES_IN format'
    );
  });
});
