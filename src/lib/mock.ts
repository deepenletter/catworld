import type { Country, StyleCard, GenerationJob } from '@/types';
import { countries } from '@/data/countries';

let mockJobStore: Record<string, GenerationJob & { createdAt: number; resultUrl?: string }> = {};

export const mockApi = {
  fetchCountries: async (): Promise<Country[]> => {
    await delay(300);
    return countries;
  },

  fetchStyles: async (slug: string): Promise<StyleCard[]> => {
    await delay(200);
    const country = countries.find((c) => c.slug === slug);
    if (!country) throw new Error(`Country not found: ${slug}`);
    return country.styles;
  },

  generateImage: async (
    userCatImage: File,
    countrySlug: string,
    styleId: string
  ): Promise<{ jobId: string; status: string }> => {
    await delay(500);
    const jobId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const resultUrl = await fileToDataUrl(userCatImage);

    mockJobStore[jobId] = {
      jobId,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      resultUrl,
    };

    // Simulate async processing
    setTimeout(() => advanceJob(jobId), 1000);
    return { jobId, status: 'pending' };
  },

  pollJob: async (jobId: string): Promise<GenerationJob> => {
    await delay(300);
    const job = mockJobStore[jobId];
    if (!job) throw new Error(`Job not found: ${jobId}`);

    const elapsed = (Date.now() - job.createdAt) / 1000;
    const progress = Math.min(100, Math.floor((elapsed / 4) * 100));

    if (elapsed >= 4) {
      return { jobId, status: 'completed', progress: 100, resultUrl: job.resultUrl };
    }
    return { jobId, status: 'processing', progress };
  },
};

function advanceJob(jobId: string) {
  const job = mockJobStore[jobId];
  if (!job) return;
  job.status = 'processing';
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
