import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

const CONFIG_PATHNAME = 'admin-config.json';

export async function GET() {
  try {
    const { blobs } = await list({ prefix: CONFIG_PATHNAME });
    const existing = blobs.find((b) => b.pathname === CONFIG_PATHNAME);
    if (!existing) return NextResponse.json({});
    const res = await fetch(existing.url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(req: Request) {
  if (req.headers.get('x-admin-pw') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const config = await req.json();
  const blob = await put(CONFIG_PATHNAME, JSON.stringify(config), {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json',
  });
  return NextResponse.json({ ok: true, url: blob.url });
}
