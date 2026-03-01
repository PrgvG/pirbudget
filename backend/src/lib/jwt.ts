import jwt from 'jsonwebtoken';

const DURATION_RE = /^\d+(s|m|h|d|w|y)$/;

export function parseExpiresIn(value: string): jwt.SignOptions['expiresIn'] {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  if (!DURATION_RE.test(value)) {
    throw new Error(
      `Invalid JWT_EXPIRES_IN format: "${value}". Expected seconds (e.g. "3600") or duration string (e.g. "7d", "24h").`
    );
  }
  return value as jwt.SignOptions['expiresIn'];
}
