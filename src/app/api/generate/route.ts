import OpenAI, { toFile } from 'openai';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY 환경변수가 없습니다.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const prompt = formData.get('prompt') as string | null;

    if (!file || !prompt) {
      return NextResponse.json({ error: 'file 또는 prompt 누락' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageFile = await toFile(buffer, 'cat.png', { type: 'image/png' });

    const response = await openai.images.edit({
      model: 'gpt-image-2',
      image: imageFile,
      prompt,
      n: 1,
      size: '1024x1536',
      quality: 'high',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('AI로부터 이미지를 받지 못했습니다.');

    return NextResponse.json({ resultUrl: `data:image/png;base64,${b64}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[generate]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
