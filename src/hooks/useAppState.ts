'use client';

import { useState, useCallback, useRef } from 'react';
import type { Country, StyleCard, AppPhase } from '@/types';
import { api } from '@/lib/api';
import { compositeImage } from '@/lib/imageComposite';
import { getAdminTemplateById } from '@/lib/templateStore';

export type AppStateValues = {
  phase: AppPhase;
  selectedCountry: Country | null;
  selectedStyle: StyleCard | null;
  uploadedImageUrl: string | null;
  uploadedFile: File | null;
  resultImageUrl: string | null;
  generationProgress: number;
  isGenerating: boolean;
  error: string | null;
};

export type AppActions = {
  goHome: () => void;
  goToGlobe: () => void;
  selectCountry: (country: Country) => void;
  selectStyle: (style: StyleCard) => void;
  handleUpload: (file: File, url: string) => void;
  clearUpload: () => void;
  generate: () => Promise<void>;
  retryStyle: () => void;
  goNewCountry: () => void;
  backToCountry: () => void;
};

export function useAppState() {
  const [phase, setPhase] = useState<AppPhase>('globe');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleCard | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goHome = useCallback(() => {
    setSelectedCountry(null);
    setSelectedStyle(null);
    setUploadedImageUrl(null);
    setUploadedFile(null);
    setResultImageUrl(null);
    setGenerationProgress(0);
    setError(null);
    setPhase('globe');
  }, []);

  const goToGlobe = useCallback(() => {
    setPhase('globe');
  }, []);

  const selectCountry = useCallback((country: Country) => {
    setSelectedCountry(country);
    setSelectedStyle(null);
    setUploadedImageUrl(null);
    setUploadedFile(null);
    setResultImageUrl(null);
    setError(null);
    setPhase('country_selected');
  }, []);

  const selectStyle = useCallback((style: StyleCard) => {
    setSelectedStyle(style);
    setPhase('style_selected');
  }, []);

  const handleUpload = useCallback((file: File, url: string) => {
    setUploadedFile(file);
    setUploadedImageUrl(url);
  }, []);

  const clearUpload = useCallback(() => {
    setUploadedFile(null);
    setUploadedImageUrl(null);
  }, []);

  const generate = useCallback(async () => {
    if (!selectedCountry || !selectedStyle || !uploadedFile) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setPhase('generating');
    setError(null);

    const adminTemplate = getAdminTemplateById(selectedStyle.id);

    // ── AI generation path (prompt 있을 때) ───────────────────────────────
    if (adminTemplate?.prompt) {
      try {
        // 진행 애니메이션 (AI 생성은 30~60초 소요)
        let prog = 0;
        const timer = setInterval(() => {
          prog = Math.min(prog + 1.5, 88);
          setGenerationProgress(Math.round(prog));
        }, 600);

        const form = new FormData();
        form.append('file', uploadedFile);
        form.append('prompt', adminTemplate.prompt);

        const res = await fetch('/api/generate', { method: 'POST', body: form });
        clearInterval(timer);

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'AI 생성 실패');

        setGenerationProgress(100);
        setResultImageUrl(data.resultUrl);
        setPhase('result');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'AI 생성 중 오류가 발생했습니다.');
        setPhase('style_selected');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // ── Canvas composite path (prompt 없고 faceBox 있을 때) ──────────────
    if (adminTemplate?.faceBox && uploadedImageUrl) {
      try {
        const progressSteps = [15, 40, 65, 85, 95];
        for (const step of progressSteps) {
          await new Promise<void>((res) => setTimeout(res, 120));
          setGenerationProgress(step);
        }
        const dataUrl = await compositeImage(
          adminTemplate.url,
          uploadedImageUrl,
          adminTemplate.faceBox,
          adminTemplate.brightness,
        );
        setGenerationProgress(100);
        setResultImageUrl(dataUrl);
        setPhase('result');
      } catch (e) {
        setError(e instanceof Error ? e.message : '이미지 합성 중 오류가 발생했습니다.');
        setPhase('style_selected');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (adminTemplate && !adminTemplate.prompt && !adminTemplate.faceBox) {
      setError('관리자가 아직 이 템플릿의 프롬프트 또는 얼굴 위치를 설정하지 않았습니다.');
      setPhase('style_selected');
      setIsGenerating(false);
      return;
    }

    // ── 레거시 mock fallback ──────────────────────────────────────────────

    try {
      const { jobId } = await api.generateImage(
        uploadedFile,
        selectedCountry.slug,
        selectedStyle.id,
      );

      await new Promise<void>((resolve, reject) => {
        pollIntervalRef.current = setInterval(async () => {
          try {
            const job = await api.pollJob(jobId);
            setGenerationProgress(job.progress ?? 0);

            if (job.status === 'completed') {
              clearInterval(pollIntervalRef.current!);
              setResultImageUrl(job.resultUrl ?? null);
              setPhase('result');
              resolve();
            } else if (job.status === 'failed') {
              clearInterval(pollIntervalRef.current!);
              reject(new Error(job.error ?? '생성에 실패했습니다.'));
            }
          } catch (e) {
            clearInterval(pollIntervalRef.current!);
            reject(e);
          }
        }, 800);
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '생성 중 오류가 발생했습니다. 다시 시도해주세요.',
      );
      setPhase('style_selected');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedCountry, selectedStyle, uploadedImageUrl, uploadedFile]);

  const retryStyle = useCallback(() => {
    setResultImageUrl(null);
    setUploadedImageUrl(null);
    setUploadedFile(null);
    setGenerationProgress(0);
    setError(null);
    setPhase('style_selected');
  }, []);

  const backToCountry = useCallback(() => {
    setSelectedStyle(null);
    setUploadedImageUrl(null);
    setUploadedFile(null);
    setError(null);
    setPhase('country_selected');
  }, []);

  const goNewCountry = useCallback(() => {
    setSelectedCountry(null);
    setSelectedStyle(null);
    setUploadedImageUrl(null);
    setUploadedFile(null);
    setResultImageUrl(null);
    setGenerationProgress(0);
    setError(null);
    setPhase('globe');
  }, []);

  return {
    state: {
      phase,
      selectedCountry,
      selectedStyle,
      uploadedImageUrl,
      uploadedFile,
      resultImageUrl,
      generationProgress,
      isGenerating,
      error,
    },
    actions: {
      goHome,
      goToGlobe,
      selectCountry,
      selectStyle,
      handleUpload,
      clearUpload,
      generate,
      retryStyle,
      goNewCountry,
      backToCountry,
    },
  };
}
