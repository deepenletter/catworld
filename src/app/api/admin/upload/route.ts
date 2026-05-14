import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (req.headers.get('x-admin-pw') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const countrySlug = formData.get('countrySlug') as string;
  if (!file || !countrySlug) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const blob = await put(`templates/${countrySlug}/${Date.now()}_${file.name}`, file, {
    access: 'public',
  });
  return NextResponse.json({ url: blob.url });
}
