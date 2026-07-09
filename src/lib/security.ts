// 공용 보안 유틸 — SSRF 방지용 URL allowlist, 클라이언트 IP 추출.

// Vercel Blob 공개 URL 형식: https://<id>.public.blob.vercel-storage.com/...
// 추가로 허용할 호스트가 있으면 ALLOWED_IMAGE_HOSTS(콤마 구분)로 지정.
const DEFAULT_ALLOWED_SUFFIXES = ['.public.blob.vercel-storage.com'];

function getExtraAllowedHosts(): string[] {
  return (process.env.ALLOWED_IMAGE_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * 서버가 대신 fetch 하거나(<img src>로) 렌더할 원격 이미지 URL이
 * 신뢰 도메인(내 Blob 스토리지 등)인지 검사한다. SSRF·콘텐츠 스푸핑 방지.
 */
export function isAllowedRemoteImageUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== 'string' || !rawUrl) return false;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();
  if (DEFAULT_ALLOWED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;

  const extra = getExtraAllowedHosts();
  return extra.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/** 프록시 뒤에서 실제 클라이언트 IP를 추출 (레이트리밋 키용). */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
