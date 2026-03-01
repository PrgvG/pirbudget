import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notFound, errorHandler } from './errorHandler';
import { AppError } from '../lib/errors';

vi.mock('../lib/logger', () => ({
  logger: { error: vi.fn() },
}));

function createMockReq() {
  return {} as Parameters<typeof notFound>[0];
}

function createMockRes(overrides: { headersSent?: boolean } = {}) {
  const res = {
    headersSent: overrides.headersSent ?? false,
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  return res;
}

const noopNext = vi.fn();

describe('notFound', () => {
  it('responds 404 with error and code', () => {
    const res = createMockRes();
    notFound(createMockReq(), res as never, noopNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Not found',
      code: 'NOT_FOUND',
    });
  });

  it('does nothing when headers already sent', () => {
    const res = createMockRes({ headersSent: true });
    notFound(createMockReq(), res as never, noopNext);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('errorHandler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.NODE_ENV;
  });

  it('handles AppError with its statusCode, message, and code', () => {
    const err = new AppError('Resource not found', {
      statusCode: 404,
      code: 'NOT_FOUND',
    });
    const res = createMockRes();

    errorHandler(err, createMockReq(), res as never, noopNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Resource not found',
      code: 'NOT_FOUND',
    });
  });

  it('handles AppError without code', () => {
    const err = new AppError('Server error');
    const res = createMockRes();

    errorHandler(err, createMockReq(), res as never, noopNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
  });

  it('returns original message in dev mode for plain Error', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('db connection failed');
    const res = createMockRes();

    errorHandler(err, createMockReq(), res as never, noopNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'db connection failed',
      code: 'INTERNAL_ERROR',
    });
  });

  it('hides error details in production for plain Error', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('db connection failed');
    const res = createMockRes();

    errorHandler(err, createMockReq(), res as never, noopNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });

  it('does nothing when headers already sent', () => {
    const res = createMockRes({ headersSent: true });

    errorHandler(new Error('x'), createMockReq(), res as never, noopNext);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('handles non-Error thrown values in dev', () => {
    process.env.NODE_ENV = 'development';
    const res = createMockRes();

    errorHandler('string error', createMockReq(), res as never, noopNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });
});
