import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware } from './auth';

const mockVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: (token: string, _secret: string) => mockVerify(token, _secret),
  },
}));

function createMockReq(overrides: { authorization?: string } = {}) {
  return {
    headers: { authorization: overrides.authorization },
  } as Parameters<typeof authMiddleware>[0];
}

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe('authMiddleware', () => {
  const next = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    next.mockClear();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('returns 500 when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    const req = createMockReq({ authorization: 'Bearer token' });
    const res = createMockRes();

    authMiddleware(req, res as never, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Server misconfiguration',
      code: 'JWT_SECRET_MISSING',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is missing', () => {
    const req = createMockReq();
    const res = createMockRes();

    authMiddleware(req, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization is not Bearer', () => {
    const req = createMockReq({ authorization: 'Basic xxx' });
    const res = createMockRes();

    authMiddleware(req, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when jwt.verify throws', () => {
    mockVerify.mockImplementation(() => {
      throw new Error('invalid token');
    });
    const req = createMockReq({ authorization: 'Bearer bad-token' });
    const res = createMockRes();

    authMiddleware(req, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when decoded payload is not JwtPayload shape', () => {
    mockVerify.mockReturnValue({ wrong: 'shape' });
    const req = createMockReq({ authorization: 'Bearer token' });
    const res = createMockRes();

    authMiddleware(req, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets req.user when token is valid', () => {
    const payload = { userId: 'id1', email: 'a@b.com' };
    mockVerify.mockReturnValue(payload);
    const req = createMockReq({ authorization: 'Bearer valid-token' });
    const res = createMockRes();

    authMiddleware(req, res as never, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
  });
});
