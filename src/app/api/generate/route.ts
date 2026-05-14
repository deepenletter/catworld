import OpenAI, { toFile } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { applyDailyQuotaCookie, consumeDailyQuota, getDailyQuota } from '@/lib/dailyQuota';
import { buildFaceSwapPrompt } from '@/lib/faceSwap';

export const maxDuration = 300;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const imageModel = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2';
const imageQuality = (
  process.env.OPENAI_IMAGE_QUALITY ?? 'medium'
) as 'low' | 'medium' | 'high' | 'auto';
const outputFormat = (process.env.OPENAI_IMAGE_OUTPUT_FORMAT ?? 'jpeg') as 'png' | 'jpeg' | 'webp';

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

export async function GET(req: NextRequest) {
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
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 });
  }

  try {
    const quota = getDailyQuota(req);
    if (quota.remaining <= 0) {
      const response = NextResponse.json(
        {
          error: `오늘 생성 한도 ${quota.limit}회를 모두 사용했습니다. 내일 다시 시도해 주세요.`,
          quota,
        },
        { status: 429 },
      );
      applyDailyQuotaCookie(response, quota);
      return response;
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const prompt = formData.get('prompt') as string | null;
    const templateUrl = formData.get('templateUrl') as string | null;
    const maskDataUrl = formData.get('maskDataUrl') as string | null;
    const size = formData.get('size') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required.' }, { status: 400 });
    }

    const userImageBuffer = Buffer.from(await file.arrayBuffer());
    const userMimeType = file.type || 'image/jpeg';
    const userImageFile = await toFile(
      userImageBuffer,
      `reference.${getExtensionFromMimeType(userMimeType)}`,
      { type: userMimeType },
    );

    const isMaskedFaceSwap = !!templateUrl && !!maskDataUrl;

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
            prompt: buildFaceSwapPrompt(prompt ?? undefined),
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
          prompt: buildFaceSwapPrompt(prompt ?? undefined),
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

    const nextQuota = consumeDailyQuota(req);
    const usage = (response as { usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } }).usage;

    const json = NextResponse.json(
      {
        resultUrl: `data:${getOutputMimeType()};base64,${b64}`,
        quota: nextQuota,
        usage: usage ?? null,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    );
    applyDailyQuotaCookie(json, nextQuota);
    return json;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
