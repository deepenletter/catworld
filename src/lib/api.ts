import type { Country, StyleCard, GenerationJob } from '@/types';
import { mockApi } from './mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

// ─── Real API client stubs ───────────────────────────────────────────────────

async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(`${API_BASE}/countries`);
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}

async function fetchStyles(slug: string): Promise<StyleCard[]> {
  const res = await fetch(`${API_BASE}/countries/${slug}/styles`);
  if (!res.ok) throw new Error('Failed to fetch styles');
  return res.json();
}

async function generateImage(
  userCatImage: File,
  countrySlug: string,
  styleId: string
): Promise<{ jobId: string; status: string }> {
  const form = new FormData();
  form.append('image', userCatImage);
  form.append('countrySlug', countrySlug);
  form.append('styleId', styleId);

  const res = await fetch(`${API_BASE}/generate`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Generation request failed');
  return res.json();
}

async function pollJob(jobId: string): Promise<GenerationJob> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) throw new Error('Job polling failed');
  return res.json();
}

// ─── Public API surface (switches between mock and real) ─────────────────────

export const api = {
  generateImage: USE_MOCK ? mockApi.generateImage : generateImage,
  pollJob: USE_MOCK ? mockApi.pollJob : pollJob,
  fetchCountries: USE_MOCK ? mockApi.fetchCountries : fetchCountries,
  fetchStyles: USE_MOCK ? mockApi.fetchStyles : fetchStyles,
};
