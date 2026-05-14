import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import type { DailyGenerationQuota } from '@/types';

const COOKIE_NAME = 'catworld_daily_quota';
const DEFAULT_DAILY_LIMIT = 3;
const DEFAULT_TIMEZONE = 'Asia/Seoul';

type QuotaPayload = {
  day: string;
  used: number;
};

function getDailyLimit(): number {
  const raw = Number(process.env.DAILY_GENERATION_LIMIT ?? DEFAULT_DAILY_LIMIT);
  if (!Number.isFinite(raw)) return DEFAULT_DAILY_LIMIT;
  return Math.max(1, Math.floor(raw));
}

function getDayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.DAILY_LIMIT_TIMEZONE ?? DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getQuotaSecret(): string {
  return (
    process.env.DAILY_LIMIT_SECRET ??
    process.env.ADMIN_PASSWORD ??
    process.env.OPENAI_API_KEY ??
    'catworld-dev-secret'
  );
}

function signPayload(payload: string): string {
  return createHmac('sha256', getQuotaSecret()).update(payload).digest('base64url');
}

function encodePayload(payload: QuotaPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(body);
  return `${body}.${signature}`;
}

function decodePayload(value?: string): QuotaPayload | null {
  if (!value) return null;

  const [body, signature] = value.split('.');
  if (!body || !signature) return null;

  const expected = signPayload(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as QuotaPayload;
    if (typeof parsed?.day !== 'string' || typeof parsed?.used !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildQuota(day: string, used: number): DailyGenerationQuota {
  const limit = getDailyLimit();
  const normalizedUsed = Math.max(0, Math.min(limit, Math.floor(used)));

  return {
    day,
    limit,
    used: normalizedUsed,
    remaining: Math.max(0, limit - normalizedUsed),
  };
}

export function getDailyQuota(request: NextRequest): DailyGenerationQuota {
  const today = getDayKey();
  const payload = decodePayload(request.cookies.get(COOKIE_NAME)?.value);

  if (!payload || payload.day !== today) {
    return buildQuota(today, 0);
  }

  return buildQuota(payload.day, payload.used);
}

export function consumeDailyQuota(request: NextRequest): DailyGenerationQuota {
  const quota = getDailyQuota(request);
  return buildQuota(quota.day, quota.used + 1);
}

export function applyDailyQuotaCookie(response: NextResponse, quota: DailyGenerationQuota) {
  response.cookies.set(COOKIE_NAME, encodePayload({ day: quota.day, used: quota.used }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 8,
  });
}
