'use client';

// Client-side downscale/re-encode before upload. Vercel serverless functions
// reject request bodies over ~4.5MB (413 FUNCTION_PAYLOAD_TOO_LARGE), which is
// exactly what raw phone photos hit — so every upload is normalized to a JPEG
// whose longest side is MAX_SIDE before it ever leaves the browser.
const MAX_SIDE = 1568;
const JPEG_QUALITY = 0.86;
const HARD_LIMIT_BYTES = 25 * 1024 * 1024;
// Original may pass through untouched only when it is already small enough for
// the serverless body limit (multipart overhead included) and a supported type.
const PASSTHROUGH_LIMIT_BYTES = 3.5 * 1024 * 1024;
const SERVER_SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class UploadImageError extends Error {}

function decodeImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new UploadImageError('이 사진 형식을 열 수 없어요. JPG, PNG, WEBP 사진으로 다시 시도해 주세요.'));
    };
    image.src = url;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new UploadImageError('사진을 변환하지 못했어요. 다른 사진으로 시도해 주세요.'));
      },
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

/**
 * Returns a file that is safe to POST to the generate API: decoded, downscaled
 * to MAX_SIDE and re-encoded as JPEG. Falls back to the original file only when
 * it is already small and in a server-supported format.
 */
export async function prepareUploadImage(original: File): Promise<File> {
  if (!original.type.startsWith('image/')) {
    throw new UploadImageError('이미지 파일만 업로드할 수 있어요.');
  }
  if (original.size > HARD_LIMIT_BYTES) {
    throw new UploadImageError('사진이 너무 커요(25MB 초과). 더 작은 사진으로 시도해 주세요.');
  }

  let image: HTMLImageElement;
  try {
    image = await decodeImage(original);
  } catch (error) {
    // Browser cannot decode it (e.g. HEIC on some browsers). Send the original
    // through only when the server/OpenAI side can still handle it.
    if (original.size <= PASSTHROUGH_LIMIT_BYTES && SERVER_SUPPORTED_TYPES.has(original.type)) {
      return original;
    }
    throw error;
  }

  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) {
    throw new UploadImageError('사진 정보를 읽지 못했어요. 다른 사진으로 시도해 주세요.');
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const alreadySmallEnough =
    scale === 1 &&
    original.size <= PASSTHROUGH_LIMIT_BYTES &&
    SERVER_SUPPORTED_TYPES.has(original.type);
  if (alreadySmallEnough) {
    return original;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new UploadImageError('사진을 처리할 수 없는 브라우저예요. 다른 브라우저로 시도해 주세요.');
  }
  // Photos with transparency get a white backing since JPEG has no alpha.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await canvasToJpegBlob(canvas);
  const baseName = original.name.replace(/\.[^.]+$/, '') || 'cat';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}
