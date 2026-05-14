import type { AdminTemplate } from '@/types';

// Module-level map: templateId → AdminTemplate
// Populated by StyleSection when admin config is fetched.
const templateMap = new Map<string, AdminTemplate>();

export function setAdminTemplates(templates: AdminTemplate[]): void {
  templateMap.clear();
  for (const t of templates) {
    templateMap.set(t.id, t);
  }
}

export function getAdminTemplateById(id: string): AdminTemplate | null {
  return templateMap.get(id) ?? null;
}

export function clearAdminTemplates(): void {
  templateMap.clear();
}
