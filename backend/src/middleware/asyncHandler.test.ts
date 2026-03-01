import { describe, it, expect, vi } from 'vitest';
import { wrapAsync } from './asyncHandler';
import type { Request, Response, NextFunction } from 'express';

function createMocks() {
  const req = {} as Request;
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('wrapAsync', () => {
  it('calls the async handler and does not call next on success', async () => {
    const handler = vi.fn(async () => {});
    const wrapped = wrapAsync(handler);
    const { req, res, next } = createMocks();

    wrapped(req, res, next);
    await vi.waitFor(() => expect(handler).toHaveBeenCalledWith(req, res, next));

    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with the error when async handler throws', async () => {
    const error = new Error('async failure');
    const handler = vi.fn(async () => {
      throw error;
    });
    const wrapped = wrapAsync(handler);
    const { req, res, next } = createMocks();

    wrapped(req, res, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(error));
  });
});
