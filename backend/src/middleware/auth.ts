import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type JwtPayload = {
  userId: string;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

function isJwtPayload(decoded: unknown): decoded is JwtPayload {
  if (typeof decoded !== 'object' || decoded === null) return false;
  const d = decoded as Record<string, unknown>;
  return typeof d.userId === 'string' && typeof d.email === 'string';
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    res.status(500).json({
      error: 'Server misconfiguration',
      code: 'JWT_SECRET_MISSING',
    });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown;
    if (isJwtPayload(decoded)) {
      req.user = decoded;
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized', code: 'INVALID_TOKEN' });
    }
  } catch {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
    });
  }
};
