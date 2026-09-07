import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { UserSession } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'patprimo_super_secret_jwt_key_2026_timeline_linea';
const COOKIE_NAME = 'patprimo_session';

export const ADMIN_EMAILS = [
  'dortiz@patprimo.com.co',
  'lsabogal@patprimo.com.co',
];

export function isAllowedDomain(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith('@patprimo.com.co') ||
    normalized.endsWith('@pash.com.co')
  );
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_patprimo_salt_2026').digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function signSessionToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: UserSession) {
  const cookieStore = await cookies();
  const token = signSessionToken(session);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
