import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { config } from './config.js';
import { ApiError } from './utils/http.js';

export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function issueToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
    issuer: 'nkfy-api',
  });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    next(new ApiError(401, 'Sign in to continue', 'unauthorized'));
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret, {
      issuer: 'nkfy-api',
    });

    if (typeof payload === 'string' || !payload.sub || typeof payload.email !== 'string') {
      throw new Error('Invalid token payload');
    }

    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new ApiError(401, 'Your session has expired. Please sign in again.', 'unauthorized'));
  }
}
