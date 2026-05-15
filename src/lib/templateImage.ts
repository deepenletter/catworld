export const TEMPLATE_WIDTH_RATIO = 3;
export const TEMPLATE_HEIGHT_RATIO = 4;
export const TEMPLATE_ASPECT_RATIO = TEMPLATE_WIDTH_RATIO / TEMPLATE_HEIGHT_RATIO;
export const TEMPLATE_ASPECT_TOLERANCE = 0.015;
export const TEMPLATE_OUTPUT_SIZE = '1024x1536';
export const TEMPLATE_RATIO_LABEL = '3:4 portrait';
export const TEMPLATE_RECOMMENDED_MIN_WIDTH = 1200;
export const TEMPLATE_RECOMMENDED_MIN_HEIGHT = 1600;

export function isTemplateAspectRatioValid(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }

  if (height <= width) {
    return false;
  }

  const aspectRatio = width / height;
  return Math.abs(aspectRatio - TEMPLATE_ASPECT_RATIO) <= TEMPLATE_ASPECT_TOLERANCE;
}

export function buildTemplateAspectRatioError(width: number, height: number): string {
  return `Template images must be ${TEMPLATE_RATIO_LABEL}. Uploaded image is ${width}x${height}.`;
}

export function buildTemplateResolutionHint(width: number, height: number): string | null {
  if (width >= TEMPLATE_RECOMMENDED_MIN_WIDTH && height >= TEMPLATE_RECOMMENDED_MIN_HEIGHT) {
    return null;
  }

  return `For cleaner template detail, use at least ${TEMPLATE_RECOMMENDED_MIN_WIDTH}x${TEMPLATE_RECOMMENDED_MIN_HEIGHT}.`;
}
