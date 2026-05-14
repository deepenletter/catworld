export type StyleCard = {
  id: string;
  title: string;
  description: string;
  gradient: string;
  accentColor: string;
  emoji: string;
  tags: string[];
  // Optional: place image at public/styles/<id>.jpg — shown instead of gradient when present
  image?: string;
  promptTemplate: string;
  identityLockInstruction: string;
  styleStrength: number;
  facePreservePriority: 'high' | 'medium';
};

export type Country = {
  slug: string;
  name: string;
  nameEn: string;
  emoji: string;
  code: string; // ISO 3166-1 alpha-2 lowercase (for flagcdn.com)
  lat: number;
  lng: number;
  accentColor: string;
  description: string;
  styles: StyleCard[];
};

export type AppPhase =
  | 'landing'
  | 'globe'
  | 'country_selected'
  | 'style_selected'
  | 'generating'
  | 'result';

export type AppState = {
  phase: AppPhase;
  selectedCountry: Country | null;
  selectedStyle: StyleCard | null;
  uploadedImageUrl: string | null;
  uploadedFile: File | null;
  resultImageUrl: string | null;
  isGenerating: boolean;
  generationProgress: number;
  error: string | null;
};

export type GenerationJob = {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  resultUrl?: string;
  error?: string;
};

export type GalleryItem = {
  id: string;
  countryName: string;
  styleTitle: string;
  imageUrl: string;
  gradient: string;
  emoji: string;
};

export type FaceBox = {
  xRatio: number;   // 0-1 fraction of image width
  yRatio: number;   // 0-1 fraction of image height
  wRatio: number;   // 0-1 fraction of image width
  hRatio: number;   // 0-1 fraction of image height
};

export type AdminTemplate = {
  id: string;
  title: string;
  url: string;           // Vercel Blob public URL
  brightness: number;    // 50-150, default 100
  faceBox: FaceBox | null;
};

export type AdminCountryConfig = {
  [countrySlug: string]: AdminTemplate[];
};
