import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'catworld_admin_session';
const ADMIN_COOKIE_BODY = 'admin';

function getAdminSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.ADMIN_PASSWORD ??
    process.env.DAILY_LIMIT_SECRET ??
    'catworld-admin-session-secret'
  );
}

function signAdminSession(body: string): string {
  return createHmac('sha256', getAdminSessionSecret()).update(body).digest('base64url');
}

function encodeAdminSessionValue(): string {
  return `${ADMIN_COOKIE_BODY}.${signAdminSession(ADMIN_COOKIE_BODY)}`;
}

function isValidAdminSessionValue(value?: string): boolean {
  if (!value) return false;

  const [body, signature] = value.split('.');
  if (!body || !signature || body !== ADMIN_COOKIE_BODY) {
    return false;
  }

  const expected = signAdminSession(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSessionValue(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function applyAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, encodeAdminSessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
