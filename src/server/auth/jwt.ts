import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import { config, isProd } from '../config';
import type { PublicUser } from '../../shared/types';

interface TokenPayload {
  id: number;
  username: string;
}

export function signToken(user: PublicUser): string {
  return jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: config.jwtMaxAgeSeconds
  });
}

export function verifyToken(token: string): PublicUser | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    if (typeof decoded.id !== 'number' || typeof decoded.username !== 'string')
      return null;
    return { id: decoded.id, username: decoded.username };
  } catch {
    return null;
  }
}

/** Serialize the auth cookie (httpOnly, Secure in prod, SameSite=Lax). */
export function serializeAuthCookie(token: string): string {
  return cookie.serialize(config.cookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: config.jwtMaxAgeSeconds
  });
}

export function clearAuthCookie(): string {
  return cookie.serialize(config.cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

/** Parse the auth cookie out of a raw Cookie header and return the verified user. */
export function userFromCookieHeader(
  cookieHeader: string | undefined
): PublicUser | null {
  if (!cookieHeader) return null;
  const parsed = cookie.parse(cookieHeader);
  const token = parsed[config.cookieName];
  return token ? verifyToken(token) : null;
}
