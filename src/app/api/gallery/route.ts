import { del, list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 유저가 "공유하기"를 누르면 shared-results/ 에 저장된다 (share/upload 라우트).
// 그 이미지들이 곧 실제 갤러리 콘텐츠.
const GALLERY_PREFIX = 'shared-results/';
const MAX_ITEMS = 24;

export async function GET() {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) return NextResponse.json({ items: [] });

    const { blobs } = await list({ prefix: GALLERY_PREFIX, token: blobToken, limit: 1000 });
    const items = blobs
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, MAX_ITEMS)
      .map((blob) => ({ url: blob.url, uploadedAt: blob.uploadedAt }));

    return NextResponse.json(
      { items },
      // 갤러리는 1분 캐시 — 트래픽이 몰려도 Blob list 호출은 분당 1회 수준.
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (error) {
    console.error('[gallery GET]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ items: [] });
  }
}

// 관리자용: 부적절한 공유 이미지 삭제.
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured.' }, { status: 500 });
    }

    const { url } = await req.json();
    if (typeof url !== 'string' || !url.includes(GALLERY_PREFIX)) {
      return NextResponse.json({ error: 'Invalid gallery URL.' }, { status: 400 });
    }

    await del(url, { token: blobToken });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[gallery DELETE]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: '삭제하지 못했어요.' }, { status: 500 });
  }
}
