import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (req.headers.get('x-admin-pw') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const countrySlug = formData.get('countrySlug') as string;

    if (!file || !countrySlug) {
      return NextResponse.json({ error: 'file 또는 countrySlug 누락' }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN 환경변수가 설정되지 않았습니다' }, { status: 500 });
    }

    const blob = await put(`templates/${countrySlug}/${Date.now()}_${file.name}`, file, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[upload] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
