'use client';

import { useCallback, useRef, useState } from 'react';
import type { AppPhase, Country, StyleCard } from '@/types';
import { api } from '@/lib/api';
import { getTemplateGenerationMode } from '@/lib/adminConfig';
import { compositeImage } from '@/lib/imageComposite';
import { createFaceSwapMaskData } from '@/lib/faceSwap';
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
    const generationMode = adminTemplate ? getTemplateGenerationMode(adminTemplate) : null;

    if (adminTemplate && generationMode === 'composite') {
      if (!adminTemplate.faceBox || !uploadedImageUrl) {
        setError('관리자 템플릿에 얼굴 영역이 아직 설정되지 않았습니다.');
        setPhase('style_selected');
        setIsGenerating(false);
        return;
      }

      try {
        const progressSteps = [15, 40, 65, 85, 95];
        for (const step of progressSteps) {
          await new Promise<void>((resolve) => setTimeout(resolve, 120));
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
      } catch (err) {
        setError(err instanceof Error ? err.message : '이미지 합성 중 오류가 발생했습니다.');
        setPhase('style_selected');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (adminTemplate && generationMode === 'ai') {
      if (!adminTemplate.prompt.trim()) {
        setError('AI 얼굴 편집에는 프롬프트가 필요합니다.');
        setPhase('style_selected');
        setIsGenerating(false);
        return;
      }

      if (!adminTemplate.faceBox) {
        setError('AI 얼굴 편집에는 템플릿 얼굴 영역 설정이 필요합니다.');
        setPhase('style_selected');
        setIsGenerating(false);
        return;
      }

      try {
        let progress = 0;
        const timer = setInterval(() => {
          progress = Math.min(progress + 1.5, 88);
          setGenerationProgress(Math.round(progress));
        }, 600);

        const { maskDataUrl, size } = await createFaceSwapMaskData(
          adminTemplate.url,
          adminTemplate.faceBox,
        );

        const form = new FormData();
        form.append('file', uploadedFile);
        form.append('prompt', adminTemplate.prompt);
        form.append('templateUrl', adminTemplate.url);
        form.append('maskDataUrl', maskDataUrl);
        form.append('size', size);

        const base = process.env.NEXT_PUBLIC_GENERATE_API_URL;
        const generateUrl = base ? `${base}/generate` : '/api/generate';
        const response = await fetch(generateUrl, { method: 'POST', body: form });
        clearInterval(timer);

        let data: { error?: string; resultUrl?: string } = {};
        try {
          data = await response.json();
        } catch {
          const text = await response.text().catch(() => '');
          throw new Error(`서버 응답을 읽지 못했습니다. (${response.status}) ${text.slice(0, 120)}`);
        }

        if (!response.ok) {
          throw new Error(data.error ?? 'AI 얼굴 편집 요청이 실패했습니다.');
        }

        setGenerationProgress(100);
        setResultImageUrl(data.resultUrl ?? null);
        setPhase('result');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'AI 얼굴 편집 중 오류가 발생했습니다.');
        setPhase('style_selected');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

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
          } catch (err) {
            clearInterval(pollIntervalRef.current!);
            reject(err);
          }
        }, 800);
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '생성 중 오류가 발생했습니다. 다시 시도해주세요.',
      );
      setPhase('style_selected');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedCountry, selectedStyle, uploadedFile, uploadedImageUrl]);

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
