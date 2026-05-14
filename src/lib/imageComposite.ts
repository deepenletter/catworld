import type { FaceBox } from '@/types';

function loadCorsImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function smartCropBox(img: HTMLImageElement): { x: number; y: number; w: number; h: number } {
  const { naturalWidth: w, naturalHeight: h } = img;
  // Square crop from top-center (where cat face typically is)
  const size = Math.min(w, h);
  return { x: (w - size) / 2, y: 0, w: size, h: size };
}

export async function compositeImage(
  templateUrl: string,
  userImageUrl: string,
  faceBox: FaceBox,
  brightness: number,
): Promise<string> {
  const [template, userImg] = await Promise.all([
    loadCorsImage(templateUrl),
    loadCorsImage(userImageUrl),
  ]);

  const W = template.naturalWidth;
  const H = template.naturalHeight;

  // Main canvas — draws template
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.filter = `brightness(${brightness}%)`;
  ctx.drawImage(template, 0, 0, W, H);
  ctx.filter = 'none';

  // Face destination rectangle in pixels
  const fx = faceBox.xRatio * W;
  const fy = faceBox.yRatio * H;
  const fw = faceBox.wRatio * W;
  const fh = faceBox.hRatio * H;

  // Source crop from user image
  const src = smartCropBox(userImg);

  // Temp canvas: user face drawn at destination size
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = W;
  faceCanvas.height = H;
  const faceCtx = faceCanvas.getContext('2d')!;
  faceCtx.drawImage(userImg, src.x, src.y, src.w, src.h, fx, fy, fw, fh);

  // Mask canvas: elliptical gradient mask
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = W;
  maskCanvas.height = H;
  const maskCtx = maskCanvas.getContext('2d')!;

  const cx = fx + fw / 2;
  const cy = fy + fh / 2;
  const feather = Math.min(fw, fh) * 0.12;
  const grad = maskCtx.createRadialGradient(
    cx,
    cy,
    Math.min(fw, fh) / 2 - feather,
    cx,
    cy,
    Math.max(fw, fh) / 2 + feather * 0.5,
  );
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  maskCtx.fillStyle = grad;
  maskCtx.beginPath();
  maskCtx.ellipse(cx, cy, fw / 2 + feather, fh / 2 + feather, 0, 0, Math.PI * 2);
  maskCtx.fill();

  // Apply mask to face canvas
  faceCtx.globalCompositeOperation = 'destination-in';
  faceCtx.drawImage(maskCanvas, 0, 0);
  faceCtx.globalCompositeOperation = 'source-over';

  // Composite face onto main canvas
  ctx.drawImage(faceCanvas, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.92);
}
