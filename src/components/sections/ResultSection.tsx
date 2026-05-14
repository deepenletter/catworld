'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share2, RotateCcw, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Country, StyleCard } from '@/types';

type Props = {
  originalImage: string | null;
  resultImage: string | null;
  country: Country | null;
  style: StyleCard | null;
  onRetry: () => void;
  onNewCountry: () => void;
};

export function ResultSection({
  originalImage,
  resultImage,
  country,
  style,
  onRetry,
  onNewCountry,
}: Props) {
  const [comparing, setComparing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `세계냥주_${country?.name ?? ''}_${style?.title ?? ''}.jpg`;
    a.click();
  };

  const handleShare = async () => {
    const shareText = `세계냥주 — 우리집 고양이가 ${country?.emoji ?? ''} ${country?.name ?? ''}로 여행 왔어요! (${style?.title ?? ''}) 🐾`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '세계냥주', text: shareText });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  return (
    <section className="min-h-screen bg-warm-50 dark:bg-warm-950 pt-20 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-green-200 dark:border-green-800">
            ✨ 변신 완료!
          </div>
          <h2 className="text-3xl font-display font-bold text-warm-900 dark:text-warm-50 mb-2">
            여행 사진이 도착했어요
          </h2>
          {country && style && (
            <p className="text-warm-500 dark:text-warm-400 text-sm">
              {country.emoji} {country.name} · {style.emoji} {style.title}
            </p>
          )}
        </motion.div>

        {/* Result image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden shadow-card-hover mb-6"
        >
          {resultImage && (
            <img
              src={resultImage}
              alt="생성된 결과 이미지"
              className="w-full object-cover"
              style={{ filter: `hue-rotate(${style ? getHueShift(style.id) : 0}deg) saturate(1.2) brightness(1.05)` }}
            />
          )}

          {/* Style badge overlay */}
          {country && style && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm border border-white/10">
              <span>{country.emoji}</span>
              <span className="font-medium">{style.title}</span>
            </div>
          )}

          {/* Demo watermark */}
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white/60 text-[10px] px-2 py-0.5 rounded-full border border-white/10">
            데모 미리보기
          </div>
        </motion.div>

        {/* Before / After comparison toggle */}
        {originalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <button
              onClick={() => setComparing((v) => !v)}
              className="w-full text-sm text-warm-500 hover:text-primary dark:text-warm-400 transition-colors py-2 border border-warm-200 dark:border-warm-800 rounded-xl hover:border-primary/40 bg-white dark:bg-warm-900"
            >
              {comparing ? '▲ 비교 닫기' : '↔ 원본과 비교하기'}
            </button>

            <AnimatePresence>
              {comparing && (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden mt-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative rounded-2xl overflow-hidden">
                      <img src={originalImage} alt="원본" className="w-full aspect-square object-cover" />
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                        원본
                      </div>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={resultImage ?? ''}
                        alt="결과"
                        className="w-full aspect-square object-cover"
                        style={{ filter: `hue-rotate(${style ? getHueShift(style.id) : 0}deg) saturate(1.2) brightness(1.05)` }}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                        변신 후
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" onClick={handleDownload} icon={<Download className="w-4 h-4" />} className="w-full">
              저장하기
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleShare}
              icon={<Share2 className="w-4 h-4" />}
              className="w-full"
            >
              {shareSuccess ? '링크 복사됨 ✓' : '공유하기'}
            </Button>
          </div>

          <Button
            size="lg"
            variant="outline"
            onClick={onRetry}
            icon={<RotateCcw className="w-4 h-4" />}
            className="w-full"
          >
            같은 나라 다른 스타일
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onClick={onNewCountry}
            icon={<Globe className="w-4 h-4" />}
            className="w-full"
          >
            다른 나라 도전하기
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function getHueShift(styleId: string): number {
  const map: Record<string, number> = {
    jp_01: -10, jp_02: 30, jp_03: 15, jp_04: -20,
    fr_01: 10, fr_02: -15, fr_03: 5, fr_04: 20,
    eg_01: 25, eg_02: 20, eg_03: 0, eg_04: 30,
    it_01: -5, it_02: -30, it_03: 15, it_04: 10,
    mx_01: 20, mx_02: 10, mx_03: 25, mx_04: 15,
    th_01: 22, th_02: -25, th_03: 35, th_04: 10,
  };
  return map[styleId] ?? 0;
}
