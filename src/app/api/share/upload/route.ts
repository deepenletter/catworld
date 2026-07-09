import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/security';
import { rateLimit } from '@/lib/rateLimit';

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
  // 스토리지 남용 방지: IP당 1시간에 20회까지.
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`share-upload:${ip}`, 20, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

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
    // 내부 예외 메시지는 로그로만 남기고 사용자에겐 일반 문구만 노출.
    console.error('[share upload]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: '공유 이미지를 저장하지 못했어요.' }, { status: 500 });
  }
}
