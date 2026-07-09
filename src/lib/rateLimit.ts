// 경량 in-memory 슬라이딩 윈도우 레이트리미터.
// 주의: 서버리스 인스턴스마다 메모리가 분리되므로 "완벽한" 전역 제한은 아니다.
// (같은 인스턴스로 몰리는 버스트성 남용은 막고, 확실한 전역 제한이 필요하면
//  Upstash/KV 같은 공유 저장소로 교체하면 된다.) 무료 인프라로 얻는 1차 방어선.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastPrune = 0;

function prune(now: number) {
  // 맵이 너무 커지지 않게 만료된 항목 정리 (최대 1분에 한 번).
  if (now - lastPrune < 60_000 && buckets.size < 5_000) return;
  lastPrune = now;
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt < now) buckets.delete(key);
  });
}

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

/**
 * key(예: `generate:<ip>`) 기준으로 windowMs 동안 limit 회까지 허용.
 * @returns allowed=false 면 차단, retryAfterSec 는 재시도까지 남은 초.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}
