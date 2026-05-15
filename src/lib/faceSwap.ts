import type { FaceBox } from '@/types';

export const DEFAULT_FACE_SWAP_PROMPT =
  'This must remain the same template image. Keep every template-provided element exactly as it is, keep the template cat in the same role within the scene, and only replace the template cat identity with the user reference cat while preserving the user cat face, breed impression, coat color, and fur markings.';

type FaceSwapPromptContext = {
  basePrompt?: string;
  templateTitle?: string;
  templateDescription?: string;
  countryName?: string;
  styleTags?: string[];
};

export function buildFaceSwapPrompt({
  basePrompt,
  templateTitle,
  templateDescription,
  countryName,
  styleTags,
}: FaceSwapPromptContext = {}): string {
  const prompt = basePrompt?.trim() || DEFAULT_FACE_SWAP_PROMPT;
  const templateReferenceParts = [
    [countryName, templateTitle].filter(Boolean).join(' / '),
    templateDescription?.trim(),
    styleTags?.length ? `Template keywords: ${styleTags.join(', ')}` : '',
  ].filter(Boolean);

  return [
    prompt,
    'Use the first image as the fixed template base image.',
    'Use the second image as the cat identity reference.',
    'This is an identity transfer, not a new scene generation.',
    templateReferenceParts.length
      ? `Template concept reference: ${templateReferenceParts.join(' | ')}`
      : '',
    'Use the template concept reference only to understand the role, styling, mood, and scenario already visible in the template image. Do not invent new scene elements that are not already present in the template.',
    'Follow this process exactly:',
    '1. Lock the template image and preserve every visible template-provided element.',
    '2. Identify what role the template cat is already playing in the template scene and keep that role unchanged.',
    '3. Transfer only the user cat identity traits into that same template cat.',
    '4. Return the same template shot with the same concept, but with the user cat replacing only the cat identity.',
    'Treat the template cat as the pose, action, composition, styling, and concept source.',
    'Treat the reference cat only as the identity source.',
    'Within the masked region, change only the cat identity traits: face shape, ear shape, eyes, muzzle, nose, breed impression, coat colors, fur texture, and markings.',
    'The output cat must keep the exact same pose, body placement, silhouette, viewing direction, limb positioning, tail direction, facial orientation, and relationship to every template-provided element from the template image.',
    'Any accessory, costume, hat, hood, scarf, clothing, prop, furniture, or scene element that already exists in the template must remain in the same place and look the same in the result.',
    'The result should feel like the same photo, same template concept, and same cat role, but with the user cat identity transferred onto it.',
    'Keep the template background, styling, accessories, clothing, props, framing, camera angle, lighting, and every unmasked region unchanged.',
    'Make the final image crisp, clean, photoreal, and sharp while preserving the original template composition.',
    'Do not create a pasted collage. Blend the identity transfer realistically with the template scene.',
  ]
    .filter(Boolean)
    .join('\n');
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

export function getOpenAIEditSize(width: number, height: number): string {
  const aspectRatio = width / height;

  if (aspectRatio <= 0.9) {
    return '1024x1536';
  }

  if (aspectRatio >= 1.1) {
    return '1536x1024';
  }

  return '1024x1024';
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

  const headCenterY = y + boxHeight * 0.4;
  const neckCenterY = y + boxHeight * 1.02;
  const chestCenterY = y + boxHeight * 1.72;
  const torsoCenterY = y + boxHeight * 2.62;

  const headRadiusX = Math.min(boxWidth * 0.98, width * 0.18);
  const headRadiusY = Math.min(boxHeight * 1.06, height * 0.17);
  const neckRadiusX = Math.min(boxWidth * 1.12, width * 0.2);
  const neckRadiusY = Math.min(boxHeight * 0.78, height * 0.12);
  const chestRadiusX = Math.min(boxWidth * 1.34, width * 0.24);
  const chestRadiusY = Math.min(boxHeight * 1.42, height * 0.22);
  const torsoRadiusX = Math.min(boxWidth * 1.08, width * 0.19);
  const torsoRadiusY = Math.min(boxHeight * 2.05, height * 0.26);

  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.fillStyle = 'rgba(0,0,0,1)';

  eraseEllipse(context, centerX, headCenterY, headRadiusX, headRadiusY);
  eraseEllipse(context, centerX, neckCenterY, neckRadiusX, neckRadiusY);
  eraseEllipse(context, centerX, chestCenterY, chestRadiusX, chestRadiusY);
  // Extend through the center of the torso so coat color transfers more naturally
  // while the untouched outer silhouette helps preserve the template pose.
  eraseEllipse(context, centerX, torsoCenterY, torsoRadiusX, torsoRadiusY);

  context.restore();

  return {
    maskDataUrl: canvas.toDataURL('image/png'),
    size: getOpenAIEditSize(width, height),
  };
}
