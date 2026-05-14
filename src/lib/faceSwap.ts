import type { FaceBox } from '@/types';

export const DEFAULT_FACE_SWAP_PROMPT =
  'Turn the cat in the template into the same cat from the user reference image. Keep the template pose and scene fixed, but match the user cat face, coat color, fur pattern, markings, and overall identity naturally.';

export function buildFaceSwapPrompt(basePrompt?: string): string {
  const prompt = basePrompt?.trim() || DEFAULT_FACE_SWAP_PROMPT;

  return [
    prompt,
    'Use the first image as the fixed template base image.',
    'Use the second image as the cat identity reference.',
    'Within the masked region, transform the template cat into the reference cat.',
    'Match the reference cat head shape, ears, eyes, muzzle, nose, coat colors, fur texture, markings, and visible neck or body fur as faithfully as possible.',
    'The result should look like the same cat from the reference image naturally performing the exact pose from the template image.',
    'Keep the template pose, body posture, paws, clothing, props, background, camera angle, framing, lighting, and every unmasked region unchanged.',
    'Do not create a pasted collage. Blend the identity transfer realistically with the template scene.',
  ].join('\n');
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const isExternal = url.startsWith('http://') || url.startsWith('https://');
    if (isExternal) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load the template image.'));
    image.src = isExternal ? `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}` : url;
  });
}

function snapToMultipleOf16(value: number): number {
  return Math.max(16, Math.round(value / 16) * 16);
}

export function getOpenAIEditSize(width: number, height: number): string {
  const maxEdge = 1536;
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

function eraseEllipse(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
) {
  context.beginPath();
  context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fill();
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
    throw new Error('Failed to create the mask canvas.');
  }

  context.fillStyle = 'rgba(255,255,255,1)';
  context.fillRect(0, 0, width, height);

  const x = faceBox.xRatio * width;
  const y = faceBox.yRatio * height;
  const boxWidth = faceBox.wRatio * width;
  const boxHeight = faceBox.hRatio * height;
  const centerX = x + boxWidth / 2;

  const headCenterY = y + boxHeight * 0.42;
  const neckCenterY = y + boxHeight * 1.2;
  const bodyCenterY = y + boxHeight * 2.35;

  const headRadiusX = Math.min(boxWidth * 1.05, width * 0.48);
  const headRadiusY = Math.min(boxHeight * 1.2, height * 0.3);
  const neckRadiusX = Math.min(boxWidth * 1.45, width * 0.49);
  const neckRadiusY = Math.min(boxHeight * 1.15, height * 0.28);
  const bodyRadiusX = Math.min(boxWidth * 1.95, width * 0.49);
  const bodyRadiusY = Math.min(boxHeight * 2.85, height * 0.49);

  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.fillStyle = 'rgba(0,0,0,1)';

  eraseEllipse(context, centerX, headCenterY, headRadiusX, headRadiusY);
  eraseEllipse(context, centerX, neckCenterY, neckRadiusX, neckRadiusY);
  eraseEllipse(context, centerX, bodyCenterY, bodyRadiusX, bodyRadiusY);

  context.restore();

  return {
    maskDataUrl: canvas.toDataURL('image/png'),
    size: getOpenAIEditSize(width, height),
  };
}
