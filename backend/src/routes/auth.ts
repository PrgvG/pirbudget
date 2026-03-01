import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import type { JwtPayload } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { wrapAsync } from '../middleware/asyncHandler';
import { validateRegisterBody, validateLoginBody } from './authValidation';
import { AppError } from '../lib/errors';
import { parseExpiresIn } from '../lib/jwt';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

function createToken(payload: JwtPayload): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  const options: jwt.SignOptions = {
    expiresIn: parseExpiresIn(JWT_EXPIRES_IN),
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

function userToResponse(user: {
  _id: unknown;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    _id: String(user._id),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// POST /api/auth/register
router.post(
  '/register',
  wrapAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const validation = validateRegisterBody(req.body);
      if (!validation.ok) {
        next(
          new AppError(validation.error, {
            statusCode: 400,
            code: validation.code,
          })
        );
        return;
      }
      const {
        email: emailStr,
        password: passwordStr,
        name: nameStr,
      } = validation;

      const existingUser = await User.findOne({ email: emailStr });
      if (existingUser) {
        next(
          new AppError('User with this email already exists', {
            statusCode: 409,
            code: 'EMAIL_EXISTS',
          })
        );
        return;
      }

      const passwordHash = await bcrypt.hash(passwordStr, 10);
      const user = new User({
        email: emailStr,
        name: nameStr,
        passwordHash,
      });
      await user.save();

      const payload: JwtPayload = {
        userId: String(user._id),
        email: user.email,
      };
      const token = createToken(payload);

      res.status(201).json({
        token,
        user: userToResponse(user),
      });
    }
  )
);

// POST /api/auth/login
router.post(
  '/login',
  wrapAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const validation = validateLoginBody(req.body);
      if (!validation.ok) {
        next(
          new AppError(validation.error, {
            statusCode: 400,
            code: validation.code,
          })
        );
        return;
      }
      const { email: emailStr, password: passwordStr } = validation;

      const user = await User.findOne({ email: emailStr }).select(
        '+passwordHash'
      );
      if (!user || !user.passwordHash) {
        next(
          new AppError('Invalid email or password', {
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
          })
        );
        return;
      }

      const match = await bcrypt.compare(passwordStr, user.passwordHash);
      if (!match) {
        next(
          new AppError('Invalid email or password', {
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
          })
        );
        return;
      }

      const payload: JwtPayload = {
        userId: String(user._id),
        email: user.email,
      };
      const token = createToken(payload);

      res.json({
        token,
        user: userToResponse(user),
      });
    }
  )
);

// GET /api/auth/me — текущий пользователь по JWT
router.get(
  '/me',
  authMiddleware,
  wrapAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        next(
          new AppError('Unauthorized', {
            statusCode: 401,
            code: 'INVALID_TOKEN',
          })
        );
        return;
      }
      const user = await User.findById(authReq.user.userId).lean();
      if (!user) {
        next(
          new AppError('User not found', {
            statusCode: 404,
            code: 'USER_NOT_FOUND',
          })
        );
        return;
      }
      res.json(
        userToResponse({
          _id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
      );
    }
  )
);

export default router;
export { createToken, userToResponse };
