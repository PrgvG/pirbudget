import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHealth } from './api';

describe('fetchHealth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns health data when response is ok and shape is valid', async () => {
    const data = { status: 'ok', message: 'Server is running' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
      })
    );

    const result = await fetchHealth();

    expect(result).toEqual(data);
  });

  it('throws Health check failed when res.ok is false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      })
    );

    await expect(fetchHealth()).rejects.toThrow('Health check failed');
  });

  it('throws Invalid health response when body lacks status or message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    await expect(fetchHealth()).rejects.toThrow('Invalid health response');
  });

  it('throws Invalid health response when status or message are not strings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 123, message: 'x' }),
      })
    );

    await expect(fetchHealth()).rejects.toThrow('Invalid health response');
  });
});
