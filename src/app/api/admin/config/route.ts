import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CONFIG_PATHNAME = 'admin-config.json';

export async function GET() {
  try {
    const { blobs } = await list({ prefix: CONFIG_PATHNAME });
    const existing = blobs.find((b) => b.pathname === CONFIG_PATHNAME);
    if (!existing) return NextResponse.json({});

    // no-store prevents CDN caching returning stale config
    const res = await fetch(existing.url, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({});
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('[config GET]', e);
    return NextResponse.json({});
  }
}

export async function PUT(req: Request) {
  if (req.headers.get('x-admin-pw') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const config = await req.json();
    const blob = await put(CONFIG_PATHNAME, JSON.stringify(config), {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[config PUT]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
