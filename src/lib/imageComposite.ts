import type { FaceBox } from '@/types';

function loadCorsImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isExternal = url.startsWith('http://') || url.startsWith('https://');
    if (isExternal) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${isExternal ? url.slice(0, 80) : url.slice(0, 30)}`));
    img.src = isExternal ? url + (url.includes('?') ? '&' : '?') + '_cb=' + Date.now() : url;
  });
}

// ─── Smart face region detection ──────────────────────────────────────────────
// Scores candidate regions by brightness variance (faces have high texture).
// Falls back to top-center square if nothing stands out.
function detectFaceRegion(
  img: HTMLImageElement,
): { x: number; y: number; w: number; h: number } {
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  const offscreen = document.createElement('canvas');
  const size = Math.min(W, H);
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d')!;

  // Sample the top-60% of the image (faces are usually there)
  const sampleH = Math.floor(H * 0.65);
  ctx.drawImage(img, 0, 0, W, sampleH, 0, 0, size, size);

  const data = ctx.getImageData(0, 0, size, size).data;

  // Divide into a 3×3 grid, pick the cell with highest luma variance
  const cellW = Math.floor(size / 3);
  const cellH = Math.floor(size / 3);
  let bestScore = -1;
  let bestCell = { col: 1, row: 0 }; // default: top-center

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x0 = col * cellW;
      const y0 = row * cellH;
      let sum = 0;
      let sumSq = 0;
      let count = 0;

      for (let y = y0; y < y0 + cellH; y += 4) {
        for (let x = x0; x < x0 + cellW; x += 4) {
          const i = (y * size + x) * 4;
          const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sum += luma;
          sumSq += luma * luma;
          count++;
        }
      }

      const mean = sum / count;
      const variance = sumSq / count - mean * mean;
      // Weight top rows more heavily (faces usually at top)
      const score = variance * (1 - row * 0.25);

      if (score > bestScore) {
        bestScore = score;
        bestCell = { col, row };
      }
    }
  }

  const cropSize = Math.floor(size * 0.7);
  const cx = Math.floor((bestCell.col + 0.5) * cellW * (W / size));
  const cy = Math.floor((bestCell.row + 0.5) * cellH * (sampleH / size));
  const x = Math.max(0, Math.min(W - cropSize, cx - cropSize / 2));
  const y = Math.max(0, Math.min(H - cropSize, cy - cropSize / 2));

  return { x, y, w: cropSize, h: cropSize };
}

// ─── Color analysis ───────────────────────────────────────────────────────────
type AvgColor = { r: number; g: number; b: number; luma: number };

function getAverageColor(data: Uint8ClampedArray, skipTransparent = true): AvgColor {
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (skipTransparent && data[i + 3] < 128) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  if (count === 0) return { r: 128, g: 128, b: 128, luma: 128 };
  r /= count; g /= count; b /= count;
  return { r, g, b, luma: 0.299 * r + 0.587 * g + 0.114 * b };
}

// ─── Color + luminosity correction ───────────────────────────────────────────
// Gently shifts the face pixels so their average tone matches the template area.
function applyColorCorrection(
  data: Uint8ClampedArray,
  src: AvgColor,
  dst: AvgColor,
  strength = 0.72, // 0 = no change, 1 = full match
) {
  // Per-channel scale, clamped to avoid extreme shifts
  const rScale = 1 + (dst.r / Math.max(1, src.r) - 1) * strength;
  const gScale = 1 + (dst.g / Math.max(1, src.g) - 1) * strength;
  const bScale = 1 + (dst.b / Math.max(1, src.b) - 1) * strength;

  const rS = Math.max(0.55, Math.min(1.8, rScale));
  const gS = Math.max(0.55, Math.min(1.8, gScale));
  const bS = Math.max(0.55, Math.min(1.8, bScale));

  // Luminosity adjustment
  const lumaScale = 1 + (dst.luma / Math.max(1, src.luma) - 1) * strength * 0.6;
  const lS = Math.max(0.6, Math.min(1.6, lumaScale));

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;
    data[i]     = Math.min(255, Math.round(data[i]     * rS * lS));
    data[i + 1] = Math.min(255, Math.round(data[i + 1] * gS * lS));
    data[i + 2] = Math.min(255, Math.round(data[i + 2] * bS * lS));
  }
}

// ─── Feathered elliptical mask ────────────────────────────────────────────────
// Draws a smooth oval mask with a wide soft edge, then blurs the alpha channel.
function applyFeatheredMask(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const feather = Math.min(w, h) * 0.22; // wider feather = softer edge

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext('2d')!;

  // Multi-stop gradient for very soft falloff
  const innerR = Math.min(w, h) / 2 - feather * 1.4;
  const outerR = Math.max(w, h) / 2 + feather * 0.2;
  const grad = maskCtx.createRadialGradient(cx, cy, Math.max(0, innerR), cx, cy, outerR);
  grad.addColorStop(0,    'rgba(0,0,0,1)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.97)');
  grad.addColorStop(0.80, 'rgba(0,0,0,0.6)');
  grad.addColorStop(0.92, 'rgba(0,0,0,0.15)');
  grad.addColorStop(1,    'rgba(0,0,0,0)');

  maskCtx.fillStyle = grad;
  maskCtx.beginPath();
  maskCtx.ellipse(cx, cy, w / 2 + feather * 0.3, h / 2 + feather * 0.3, 0, 0, Math.PI * 2);
  maskCtx.fill();

  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

// ─── Main composite ───────────────────────────────────────────────────────────
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

  // ── 1. Draw template ──────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.filter = `brightness(${brightness}%)`;
  ctx.drawImage(template, 0, 0, W, H);
  ctx.filter = 'none';

  // ── 2. Face destination rect ──────────────────────────────────────────────
  const fx = Math.round(faceBox.xRatio * W);
  const fy = Math.round(faceBox.yRatio * H);
  const fw = Math.round(faceBox.wRatio * W);
  const fh = Math.round(faceBox.hRatio * H);

  // ── 3. Sample template's face area color for matching ─────────────────────
  const templateFacePixels = ctx.getImageData(fx, fy, fw, fh).data;
  const templateColor = getAverageColor(templateFacePixels, false);

  // ── 4. Detect face region in user image ───────────────────────────────────
  const src = detectFaceRegion(userImg);

  // ── 5. Draw user face into a temporary canvas (at template face size) ─────
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = fw;
  faceCanvas.height = fh;
  const faceCtx = faceCanvas.getContext('2d')!;
  faceCtx.drawImage(userImg, src.x, src.y, src.w, src.h, 0, 0, fw, fh);

  // ── 6. Color-match user face to template ──────────────────────────────────
  const facePixels = faceCtx.getImageData(0, 0, fw, fh);
  const faceColor = getAverageColor(facePixels.data);
  applyColorCorrection(facePixels.data, faceColor, templateColor, 0.65);
  faceCtx.putImageData(facePixels, 0, 0);

  // ── 7. Apply feathered oval mask ──────────────────────────────────────────
  applyFeatheredMask(faceCtx, fw, fh);

  // ── 8. Composite onto template ────────────────────────────────────────────
  ctx.drawImage(faceCanvas, fx, fy);

  // ── 9. Subtle vignette-style shadow around the blend edge ─────────────────
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = W;
  shadowCanvas.height = H;
  const shadowCtx = shadowCanvas.getContext('2d')!;

  const shadowFeather = Math.min(fw, fh) * 0.08;
  const shadowGrad = shadowCtx.createRadialGradient(
    fx + fw / 2, fy + fh / 2, Math.min(fw, fh) / 2 * 0.7,
    fx + fw / 2, fy + fh / 2, Math.max(fw, fh) / 2 + shadowFeather,
  );
  shadowGrad.addColorStop(0,    'rgba(0,0,0,0)');
  shadowGrad.addColorStop(0.75, 'rgba(0,0,0,0)');
  shadowGrad.addColorStop(0.88, 'rgba(0,0,0,0.18)');
  shadowGrad.addColorStop(1,    'rgba(0,0,0,0)');

  shadowCtx.fillStyle = shadowGrad;
  shadowCtx.beginPath();
  shadowCtx.ellipse(
    fx + fw / 2, fy + fh / 2,
    fw / 2 + shadowFeather, fh / 2 + shadowFeather,
    0, 0, Math.PI * 2,
  );
  shadowCtx.fill();

  ctx.drawImage(shadowCanvas, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.93);
}
