import rateLimit from 'express-rate-limit';

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 минут
const max = Number(process.env.RATE_LIMIT_MAX) || 100;

export const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

// Более строгий лимит только для POST /api/auth (логин, регистрация).
// GET /api/auth/me (проверка токена при обновлении страницы) не ограничиваем этим лимитом.
const authWindowMs =
  Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000;
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX) || 10;

export const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.method !== 'POST',
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});
