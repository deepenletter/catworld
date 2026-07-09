import OpenAI, { toFile } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { applyDailyQuotaCookie, consumeDailyQuota, getDailyQuota } from '@/lib/dailyQuota';
import { getDailyBudget, incrementDailyBudget } from '@/lib/dailyBudget';
import { getClientIp, isAllowedRemoteImageUrl } from '@/lib/security';
import { rateLimit } from '@/lib/rateLimit';
import { buildFaceSwapPrompt } from '@/lib/faceSwap';

export const maxDuration = 300;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const imageModel = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2';
const imageQuality = (
  process.env.OPENAI_IMAGE_QUALITY ?? 'medium'
) as 'low' | 'medium' | 'high' | 'auto';
const outputFormat = (process.env.OPENAI_IMAGE_OUTPUT_FORMAT ?? 'jpeg') as 'png' | 'jpeg' | 'webp';

// OpenAI 결제 한도/크레딧 소진 등 "서비스가 잠시 닫힌" 류의 에러인지 판별.
// 이런 경우 사용자에겐 무서운 "오류" 대신 친절한 "마감" 문구를 보여준다.
function isServiceClosedError(error: unknown): boolean {
  const e = error as { code?: string; type?: string; message?: string } | null;
  if (!e) return false;
  const haystack = `${e.code ?? ''} ${e.type ?? ''} ${e.message ?? ''}`.toLowerCase();
  return (
    haystack.includes('billing') ||
    haystack.includes('insufficient_quota') ||
    haystack.includes('hard limit') ||
    haystack.includes('exceeded your current quota')
  );
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  return new OpenAI({ apiKey });
}

function getOutputCompression() {
  if (outputFormat === 'png') return undefined;
  const raw = Number(process.env.OPENAI_IMAGE_OUTPUT_COMPRESSION ?? 82);
  if (!Number.isFinite(raw)) return 82;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function getOutputMimeType() {
  return outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`;
}

function getExtensionFromMimeType(mimeType: string): string {
  return mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
}

async function fetchRemoteFile(url: string) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch template image. (${response.status})`);
  }

  const mimeType = response.headers.get('content-type') || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, mimeType };
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid mask data.');
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function parseStyleTags(rawStyleTags: string | null): string[] | undefined {
  if (!rawStyleTags) return undefined;

  try {
    const parsed = JSON.parse(rawStyleTags);
    return Array.isArray(parsed) ? parsed.filter((tag) => typeof tag === 'string') : undefined;
  } catch {
    return undefined;
  }
}

export async function GET(req: NextRequest) {
  if (isAdminRequest(req)) {
    return NextResponse.json(
      {
        quota: null,
        settings: {
          model: imageModel,
          quality: imageQuality,
          format: outputFormat,
        },
        quotaBypassed: true,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  const quota = getDailyQuota(req);
  return NextResponse.json(
    {
      quota,
      settings: {
        model: imageModel,
        quality: imageQuality,
        format: outputFormat,
      },
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

export async function POST(req: NextRequest) {
  try {
    const openai = getOpenAIClient();
    const quotaBypassed = isAdminRequest(req);
    const quota = quotaBypassed ? null : getDailyQuota(req);

    if (quota && quota.remaining <= 0) {
      const response = NextResponse.json(
        {
          error: `오늘 생성 시도 ${quota.limit}회를 모두 사용했습니다. 내일 다시 시도해 주세요.`,
          quota,
        },
        { status: 429 },
      );
      applyDailyQuotaCookie(response, quota);
      return response;
    }

    // IP 레이트리밋 — 쿠키 삭제로 일일 할당량을 무한 우회하는 남용을 1차 차단 (관리자 예외).
    if (!quotaBypassed) {
      const ip = getClientIp(req.headers);
      const rl = rateLimit(`generate:${ip}`, 20, 60 * 60_000);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: '요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.', quota },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
        );
      }
    }

    // 전역 일일 예산 상한 — 하루 총 생성 수가 한도에 도달하면 마감 (관리자는 예외).
    if (!quotaBypassed) {
      const budget = await getDailyBudget();
      if (budget.exceeded) {
        return NextResponse.json(
          {
            error: '오늘 준비된 무료 체험 인원이 모두 찼어요. 내일 다시 만나요! 🐾',
            quota,
          },
          { status: 429, headers: { 'Cache-Control': 'no-store' } },
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const prompt = formData.get('prompt') as string | null;
    const templateUrl = formData.get('templateUrl') as string | null;
    const maskDataUrl = formData.get('maskDataUrl') as string | null;
    const size = formData.get('size') as string | null;
    const countryName = formData.get('countryName') as string | null;
    const templateTitle = formData.get('templateTitle') as string | null;
    const templateDescription = formData.get('templateDescription') as string | null;
    const rawStyleTags = formData.get('styleTags') as string | null;
    const styleTags = parseStyleTags(rawStyleTags);

    if (!file) {
      return NextResponse.json({ error: 'file is required.' }, { status: 400 });
    }

    // SSRF 방어: 서버가 대신 fetch 할 templateUrl은 신뢰 도메인(내 Blob)만 허용.
    if (templateUrl && !isAllowedRemoteImageUrl(templateUrl)) {
      return NextResponse.json({ error: 'Invalid template URL.' }, { status: 400 });
    }

    const userImageBuffer = Buffer.from(await file.arrayBuffer());
    const userMimeType = file.type || 'image/jpeg';
    const userImageFile = await toFile(
      userImageBuffer,
      `reference.${getExtensionFromMimeType(userMimeType)}`,
      { type: userMimeType },
    );

    const isMaskedFaceSwap = !!templateUrl && !!maskDataUrl;
    const promptPayload = buildFaceSwapPrompt({
      basePrompt: prompt ?? undefined,
      countryName: countryName ?? undefined,
      templateTitle: templateTitle ?? undefined,
      templateDescription: templateDescription ?? undefined,
      styleTags,
    });

    const outputCompression = getOutputCompression();
    const response = isMaskedFaceSwap
      ? await (async () => {
          const remoteTemplate = await fetchRemoteFile(templateUrl);
          const maskFileData = parseDataUrl(maskDataUrl);

          const templateImageFile = await toFile(
            remoteTemplate.buffer,
            `template.${getExtensionFromMimeType(remoteTemplate.mimeType)}`,
            { type: remoteTemplate.mimeType },
          );
          const maskFile = await toFile(maskFileData.buffer, 'mask.png', {
            type: maskFileData.mimeType || 'image/png',
          });

          return openai.images.edit({
            model: imageModel,
            image: [templateImageFile, userImageFile],
            mask: maskFile,
            prompt: promptPayload,
            n: 1,
            size: size || 'auto',
            quality: imageQuality,
            output_format: outputFormat,
            ...(outputCompression !== undefined ? { output_compression: outputCompression } : {}),
          });
        })()
      : await openai.images.edit({
          model: imageModel,
          image: userImageFile,
          prompt: promptPayload,
          n: 1,
          size: size || '1024x1024',
          quality: imageQuality,
          output_format: outputFormat,
          ...(outputCompression !== undefined ? { output_compression: outputCompression } : {}),
        });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      console.error('[generate] unexpected response:', JSON.stringify(response).slice(0, 300));
      throw new Error('No edited image was returned from OpenAI.');
    }

    const nextQuota = quotaBypassed ? null : consumeDailyQuota(req);
    if (!quotaBypassed) {
      await incrementDailyBudget();
    }
    const usage = (
      response as {
        usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
      }
    ).usage;

    const json = NextResponse.json(
      {
        resultUrl: `data:${getOutputMimeType()};base64,${b64}`,
        quota: nextQuota,
        usage: usage ?? null,
        quotaBypassed,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    );

    if (nextQuota) {
      applyDailyQuotaCookie(json, nextQuota);
    }

    return json;
  } catch (error) {
    // 내부 예외 상세는 로그로만. 사용자에겐 일반 문구.
    console.error('[generate]', error instanceof Error ? error.message : String(error));

    // OpenAI 결제 한도/크레딧 소진 → 무서운 오류 대신 친절한 마감 안내.
    if (isServiceClosedError(error)) {
      return NextResponse.json(
        { error: '오늘 준비된 무료 체험이 모두 소진됐어요. 내일 다시 만나요! 🐾' },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: 'AI 고양이 편집 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
