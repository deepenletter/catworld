import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { applyAdminSessionCookie, clearAdminSessionCookie } from '@/lib/adminSession';
import { getClientIp } from '@/lib/security';
import { rateLimit } from '@/lib/rateLimit';

// 타이밍 공격 방지: 두 값을 항상 같은 길이(HMAC)로 만들어 상수시간 비교.
function safeEquals(a: string, b: string): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET ?? 'catworld-compare';
  const ha = createHmac('sha256', secret).update(a).digest();
  const hb = createHmac('sha256', secret).update(b).digest();
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

export async function POST(req: Request) {
  // 무차별 대입 방어: IP당 10분에 10회까지만 시도 허용.
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`admin-login:${ip}`, 10, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  let password = '';
  try {
    const body = await req.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    password = '';
  }

  if (adminPassword && password && safeEquals(password, adminPassword)) {
    const response = NextResponse.json({ ok: true });
    applyAdminSessionCookie(response);
    return response;
  }

  const response = NextResponse.json({ ok: false }, { status: 401 });
  clearAdminSessionCookie(response);
  return response;
}
