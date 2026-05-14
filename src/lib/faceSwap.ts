import type { FaceBox } from '@/types';

export const DEFAULT_FACE_SWAP_PROMPT =
  '사용자가 첨부한 사진 속 고양이 얼굴을 템플릿에 그대로 적용해 주세요. 고양이 얼굴 외 다른 요소는 절대 바뀌면 안 되며, 첨부한 고양이의 털과 생김새는 그대로 유지해 주세요.';

export function buildFaceSwapPrompt(basePrompt?: string): string {
  const prompt = basePrompt?.trim() || DEFAULT_FACE_SWAP_PROMPT;

  return [
    prompt,
    'Use the first image as the fixed template base image.',
    'Use the second image as the cat identity reference.',
    'Edit only inside the masked cat face area.',
    'Replace only the cat face in the template with the face of the reference cat.',
    'Preserve the reference cat facial structure, fur pattern, markings, colors, eyes, muzzle, nose, ears, and overall likeness as faithfully as possible.',
    'Do not change the template background, body, pose, clothing, props, camera angle, framing, lighting, shadows, or any other element outside the mask.',
    'The output must look like a realistic face swap, not a pasted collage.',
  ].join('\n');
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const isExternal = url.startsWith('http://') || url.startsWith('https://');
    if (isExternal) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('템플릿 이미지를 불러오지 못했습니다.'));
    image.src = isExternal ? `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}` : url;
  });
}

function snapToMultipleOf16(value: number): number {
  return Math.max(16, Math.round(value / 16) * 16);
}

export function getOpenAIEditSize(width: number, height: number): string {
  const maxEdge = 2048;
  const maxAspectRatio = 3;

  let w = width;
  let h = height;

  const aspectRatio = w / h;
  if (aspectRatio > maxAspectRatio) {
    w = h * maxAspectRatio;
  } else if (1 / aspectRatio > maxAspectRatio) {
    h = w * maxAspectRatio;
  }

  const scaleDown = Math.min(1, maxEdge / Math.max(w, h));
  w *= scaleDown;
  h *= scaleDown;

  let finalW = snapToMultipleOf16(w);
  let finalH = snapToMultipleOf16(h);

  const minPixels = 655360;
  const currentPixels = finalW * finalH;
  if (currentPixels < minPixels) {
    const scaleUp = Math.sqrt(minPixels / currentPixels);
    finalW = snapToMultipleOf16(finalW * scaleUp);
    finalH = snapToMultipleOf16(finalH * scaleUp);
  }

  finalW = Math.min(finalW, 2048);
  finalH = Math.min(finalH, 2048);

  return `${finalW}x${finalH}`;
}

export async function createFaceSwapMaskData(
  templateUrl: string,
  faceBox: FaceBox,
): Promise<{ maskDataUrl: string; size: string }> {
  const templateImage = await loadImage(templateUrl);
  const width = templateImage.naturalWidth;
  const height = templateImage.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('마스크 캔버스를 만들지 못했습니다.');
  }

  context.fillStyle = 'rgba(255,255,255,1)';
  context.fillRect(0, 0, width, height);

  const x = Math.round(faceBox.xRatio * width);
  const y = Math.round(faceBox.yRatio * height);
  const w = Math.round(faceBox.wRatio * width);
  const h = Math.round(faceBox.hRatio * height);

  context.clearRect(x, y, w, h);

  return {
    maskDataUrl: canvas.toDataURL('image/png'),
    size: getOpenAIEditSize(width, height),
  };
}
