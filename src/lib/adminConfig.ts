import type {
  AdminCountryConfig,
  AdminTemplate,
  FaceBox,
  TemplateGenerationMode,
} from '@/types';

function isFaceBox(value: unknown): value is FaceBox {
  if (!value || typeof value !== 'object') return false;

  const maybeFaceBox = value as Partial<FaceBox>;
  return (
    typeof maybeFaceBox.xRatio === 'number' &&
    typeof maybeFaceBox.yRatio === 'number' &&
    typeof maybeFaceBox.wRatio === 'number' &&
    typeof maybeFaceBox.hRatio === 'number'
  );
}

function clampBrightness(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 100;
  return Math.max(50, Math.min(150, Math.round(value)));
}

export function getTemplateGenerationMode(
  template: Pick<AdminTemplate, 'generationMode' | 'prompt'>,
): TemplateGenerationMode {
  if (template.generationMode === 'composite' || template.generationMode === 'ai') {
    return template.generationMode;
  }

  return template.prompt?.trim() ? 'ai' : 'composite';
}

export function normalizeAdminTemplate(
  value: unknown,
  fallbackId: string,
  fallbackTitle = 'Untitled template',
): AdminTemplate | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Partial<AdminTemplate>;
  if (typeof raw.url !== 'string' || !raw.url) return null;

  const prompt = typeof raw.prompt === 'string' ? raw.prompt : '';
  const normalized: AdminTemplate = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : fallbackId,
    title: typeof raw.title === 'string' && raw.title ? raw.title : fallbackTitle,
    url: raw.url,
    brightness: clampBrightness(raw.brightness),
    faceBox: isFaceBox(raw.faceBox) ? raw.faceBox : null,
    prompt,
    generationMode: getTemplateGenerationMode({
      generationMode: raw.generationMode,
      prompt,
    }),
  };

  return normalized;
}

export function normalizeAdminConfig(value: unknown): AdminCountryConfig {
  if (!value || typeof value !== 'object') return {};

  const rawConfig = value as Record<string, unknown>;
  const normalized: AdminCountryConfig = {};

  for (const [countrySlug, templates] of Object.entries(rawConfig)) {
    if (!Array.isArray(templates)) continue;

    normalized[countrySlug] = templates
      .map((template, index) =>
        normalizeAdminTemplate(
          template,
          `${countrySlug}_${index + 1}`,
          `${countrySlug} template ${index + 1}`,
        ),
      )
      .filter((template): template is AdminTemplate => template !== null);
  }

  return normalized;
}
