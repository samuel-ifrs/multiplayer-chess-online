import { Router } from 'express';
import { z } from 'zod';
import { createPlayer, findByUsername } from '../db/playersRepo';
import { hashPassword, verifyPassword } from '../auth/password';
import {
  signToken,
  serializeAuthCookie,
  clearAuthCookie,
  userFromCookieHeader
} from '../auth/jwt';
import type { PublicUser } from '../../shared/types';

const credsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'username may only contain letters, numbers, _ and -'
    ),
  password: z.string().min(6).max(128)
});

export const authRoutes = Router();

authRoutes.post('/register', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? 'invalid_input' });
  }
  const { username, password } = parsed.data;

  const existing = await findByUsername(username);
  if (existing) return res.status(409).json({ error: 'username_taken' });

  const hash = await hashPassword(password);
  const row = await createPlayer(username, hash);
  const user: PublicUser = { id: row.id, username: row.username };

  res.setHeader('Set-Cookie', serializeAuthCookie(signToken(user)));
  return res.status(201).json({ user });
});

authRoutes.post('/login', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const { username, password } = parsed.data;

  const row = await findByUsername(username);
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  const user: PublicUser = { id: row.id, username: row.username };
  res.setHeader('Set-Cookie', serializeAuthCookie(signToken(user)));
  return res.json({ user });
});

authRoutes.post('/logout', (_req, res) => {
  res.setHeader('Set-Cookie', clearAuthCookie());
  return res.json({ ok: true });
});

authRoutes.get('/me', (req, res) => {
  const user = userFromCookieHeader(req.headers.cookie);
  return res.json({ user: user ?? null });
});
