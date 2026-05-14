import { list, put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CONFIG_PATHNAME = 'admin-config.json';

export async function GET() {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) return NextResponse.json({});

    const { blobs } = await list({
      prefix: CONFIG_PATHNAME,
      token: blobToken,
    });
    const existing = blobs.find((blob) => blob.pathname === CONFIG_PATHNAME);
    if (!existing) return NextResponse.json({});

    const response = await fetch(existing.url, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({});

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[config GET]', error);
    return NextResponse.json({});
  }
}

export async function PUT(req: Request) {
  if (req.headers.get('x-admin-pw') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured.' }, { status: 500 });
    }

    const config = await req.json();
    const blob = await put(CONFIG_PATHNAME, JSON.stringify(config), {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json',
      token: blobToken,
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[config PUT]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
