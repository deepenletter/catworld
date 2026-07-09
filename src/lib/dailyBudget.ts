import { list, put } from '@vercel/blob';

// 전역(모든 사용자 합산) 하루 생성 상한 — OpenAI 이미지 비용 폭탄 방지용 안전장치.
// 쿠키 기반 dailyQuota(사용자별 3회)와 별개로, 하루 총 성공 생성 수를 제한한다.
// Vercel Blob에 카운터 JSON을 저장해 Vercel(/api/generate)·Render(render-api) 두 경로가 공유한다.
// 저장소가 없거나 오류면 fail-open(생성을 막지 않음)이라 사이트가 절대 멈추지 않는다.

const BUDGET_PREFIX = 'catworld-budget';
const DEFAULT_DAILY_BUDGET_LIMIT = 60;
const DEFAULT_TIMEZONE = 'Asia/Seoul';

export type DailyBudgetStatus = {
  day: string;
  limit: number;
  used: number;
  remaining: number;
  exceeded: boolean;
};

function getBudgetLimit(): number {
  const raw = Number(process.env.DAILY_BUDGET_LIMIT ?? DEFAULT_DAILY_BUDGET_LIMIT);
  if (!Number.isFinite(raw)) return DEFAULT_DAILY_BUDGET_LIMIT;
  return Math.max(1, Math.floor(raw));
}

function getDayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.DAILY_LIMIT_TIMEZONE ?? DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function pathFor(day: string): string {
  return `${BUDGET_PREFIX}/${day}.json`;
}

async function readCount(day: string, token: string): Promise<number> {
  const { blobs } = await list({ prefix: pathFor(day), limit: 1, token });
  if (!blobs.length) return 0;
  // CDN 캐시 우회를 위해 no-store + 캐시버스터 쿼리
  const res = await fetch(`${blobs[0].url}?_=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return 0;
  const data = (await res.json().catch(() => null)) as { count?: number } | null;
  return typeof data?.count === 'number' ? data.count : 0;
}

export async function getDailyBudget(): Promise<DailyBudgetStatus> {
  const day = getDayKey();
  const limit = getBudgetLimit();
  const token = getToken();

  let used = 0;
  if (token) {
    try {
      used = await readCount(day, token);
    } catch {
      used = 0; // fail-open
    }
  }

  return {
    day,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    exceeded: used >= limit,
  };
}

export async function incrementDailyBudget(): Promise<void> {
  const token = getToken();
  if (!token) return;

  const day = getDayKey();
  try {
    const current = await readCount(day, token);
    await put(pathFor(day), JSON.stringify({ day, count: current + 1 }), {
      access: 'public',
      contentType: 'application/json',
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } catch {
    // fail-open: 카운터 기록 실패로 생성을 막지 않는다.
  }
}
