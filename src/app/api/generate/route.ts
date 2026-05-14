import OpenAI, { toFile } from 'openai';
import { NextResponse } from 'next/server';
import { buildFaceSwapPrompt } from '@/lib/faceSwap';

export const maxDuration = 300;
export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const imageModel = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2';

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

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const prompt = formData.get('prompt') as string | null;
    const templateUrl = formData.get('templateUrl') as string | null;
    const maskDataUrl = formData.get('maskDataUrl') as string | null;
    const size = formData.get('size') as string | null;

    if (!file || !prompt) {
      return NextResponse.json({ error: 'file and prompt are required.' }, { status: 400 });
    }

    const userImageBuffer = Buffer.from(await file.arrayBuffer());
    const userMimeType = file.type || 'image/jpeg';
    const userImageFile = await toFile(
      userImageBuffer,
      `reference.${getExtensionFromMimeType(userMimeType)}`,
      { type: userMimeType },
    );

    const isMaskedFaceSwap = !!templateUrl && !!maskDataUrl;

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
            prompt: buildFaceSwapPrompt(prompt),
            n: 1,
            size: size || 'auto',
            quality: 'high',
          });
        })()
      : await openai.images.edit({
          model: imageModel,
          image: userImageFile,
          prompt,
          n: 1,
          size: size || '1024x1024',
          quality: 'high',
        });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      console.error('[generate] unexpected response:', JSON.stringify(response).slice(0, 300));
      throw new Error('No edited image was returned from OpenAI.');
    }

    return NextResponse.json({ resultUrl: `data:image/png;base64,${b64}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
