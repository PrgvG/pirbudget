import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { isAppError } from '../lib/errors';

type ErrorResponse = {
  error: string;
  code?: string;
};

export function notFound(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) return;
  res
    .status(404)
    .json({ error: 'Not found', code: 'NOT_FOUND' } as ErrorResponse);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) {
    return;
  }

  if (isAppError(err)) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code && { code: err.code }),
    } as ErrorResponse);
    return;
  }

  const isDev = process.env.NODE_ENV !== 'production';
  const message = err instanceof Error ? err.message : 'Internal server error';

  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    error: isDev ? message : 'Internal server error',
    ...(isDev && err instanceof Error && { code: 'INTERNAL_ERROR' }),
  } as ErrorResponse);
}
