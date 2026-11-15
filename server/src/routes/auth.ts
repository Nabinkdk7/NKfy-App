import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';

import { hashPassword, issueToken, requireAuth, verifyPassword } from '../auth.js';
import { db } from '../db.js';
import type { PublicUser } from '../types.js';
import { ApiError, asyncHandler } from '../utils/http.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: string;
}

const router = Router();

const credentialsSchema = z.object({
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  displayName: z.string().trim().min(2).max(40).optional(),
});

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
});

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = credentialsSchema.parse(req.body);

    const existing = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(input.email) as { id: string } | undefined;

    if (existing) {
      throw new ApiError(409, 'An account with this email already exists', 'email_in_use');
    }

    const id = randomUUID();
    const displayName = input.displayName || input.email.split('@')[0] || 'Listener';
    const createdAt = new Date().toISOString();
    const passwordHash = hashPassword(input.password);

    db.prepare(
      `INSERT INTO users (id, email, password_hash, display_name, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, input.email, passwordHash, displayName, createdAt);

    const user: PublicUser = { id, email: input.email, displayName, createdAt };
    res.status(201).json({ token: issueToken(user), user });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = credentialsSchema.parse(req.body);

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(input.email) as
      | UserRow
      | undefined;

    if (!row || !verifyPassword(input.password, row.password_hash)) {
      throw new ApiError(401, 'Email or password is incorrect', 'invalid_credentials');
    }

    const user = toPublicUser(row);
    res.json({ token: issueToken(user), user });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as
      | UserRow
      | undefined;

    if (!row) {
      throw new ApiError(404, 'Account not found', 'account_not_found');
    }

    res.json({ user: toPublicUser(row) });
  })
);

router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = updateProfileSchema.parse(req.body);

    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(
      input.displayName,
      req.user!.id
    );

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as unknown as UserRow;
    res.json({ user: toPublicUser(row) });
  })
);

export default router;
