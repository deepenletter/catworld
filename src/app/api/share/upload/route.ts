import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid share image data.');
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function getOrigin(req: Request) {
  const url = new URL(req.url);
  return url.origin;
}

export async function POST(req: Request) {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const imageDataUrl = typeof body?.imageDataUrl === 'string' ? body.imageDataUrl : '';
    const title = typeof body?.title === 'string' ? body.title : '세계냥주 결과';
    const description = typeof body?.description === 'string' ? body.description : '';

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'imageDataUrl is required.' }, { status: 400 });
    }

    if (!imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Only image data URLs are supported.' }, { status: 400 });
    }

    if (imageDataUrl.length > 12_000_000) {
      return NextResponse.json({ error: 'Share image is too large.' }, { status: 413 });
    }

    const parsed = parseDataUrl(imageDataUrl);
    const blob = await put(
      `shared-results/${Date.now()}.png`,
      parsed.buffer,
      {
        access: 'public',
        contentType: parsed.mimeType || 'image/png',
        token: blobToken,
      },
    );

    const shareUrl = new URL('/shared', getOrigin(req));
    shareUrl.searchParams.set('image', blob.url);
    shareUrl.searchParams.set('title', title);
    if (description) {
      shareUrl.searchParams.set('description', description);
    }

    return NextResponse.json({
      imageUrl: blob.url,
      shareUrl: shareUrl.toString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[share upload]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
