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

export type CustomCountryData = {
  slug: string;
  name: string;
  nameEn: string;
  code: string;
  lat: number;
  lng: number;
};

export function extractCustomCountries(value: unknown): CustomCountryData[] {
  if (!value || typeof value !== 'object') return [];
  const meta = (value as Record<string, unknown>)._meta;
  if (!meta || typeof meta !== 'object') return [];
  const list = (meta as Record<string, unknown>).customCountries;
  if (!Array.isArray(list)) return [];
  return list.filter(
    (c): c is CustomCountryData =>
      !!c &&
      typeof c === 'object' &&
      typeof (c as CustomCountryData).slug === 'string' &&
      typeof (c as CustomCountryData).name === 'string' &&
      typeof (c as CustomCountryData).code === 'string' &&
      typeof (c as CustomCountryData).lat === 'number' &&
      typeof (c as CustomCountryData).lng === 'number',
  );
}

export function extractEnabledCountrySlugs(value: unknown): string[] | null {
  if (!value || typeof value !== 'object') return null;
  const meta = (value as Record<string, unknown>)._meta;
  if (!meta || typeof meta !== 'object') return null;
  const slugs = (meta as Record<string, unknown>).enabledCountrySlugs;
  if (!Array.isArray(slugs)) return null;
  return slugs.filter((s): s is string => typeof s === 'string');
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
