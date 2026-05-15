import { NextResponse } from 'next/server';
import { applyAdminSessionCookie, clearAdminSessionCookie } from '@/lib/adminSession';

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password === process.env.ADMIN_PASSWORD) {
    const response = NextResponse.json({ ok: true });
    applyAdminSessionCookie(response);
    return response;
  }

  const response = NextResponse.json({ ok: false }, { status: 401 });
  clearAdminSessionCookie(response);
  return response;
}
