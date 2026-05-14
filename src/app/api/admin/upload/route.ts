import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (req.headers.get('x-admin-pw') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const countrySlug = formData.get('countrySlug') as string | null;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!file || !countrySlug) {
      return NextResponse.json({ error: 'file and countrySlug are required.' }, { status: 400 });
    }

    if (!blobToken) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured.' }, { status: 500 });
    }

    const blob = await put(`templates/${countrySlug}/${Date.now()}_${file.name}`, file, {
      access: 'public',
      token: blobToken,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[upload] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
