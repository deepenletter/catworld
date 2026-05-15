'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CatPawIcon } from '@/components/ui/CatPawIcon';
import type { Country, DailyGenerationQuota, StyleCard } from '@/types';

type Props = {
  country: Country;
  style: StyleCard;
  uploadedImage: string | null;
  isGenerating: boolean;
  error: string | null;
  dailyQuota: DailyGenerationQuota | null;
  dailyQuotaApplies: boolean;
  onUpload: (file: File, url: string) => void;
  onClearUpload: () => void;
  onGenerate: () => void;
  onChangeStyle: () => void;
};

export function UploadSection({
  country,
  style,
  uploadedImage,
  isGenerating,
  error,
  dailyQuota,
  dailyQuotaApplies,
  onUpload,
  onClearUpload,
  onGenerate,
  onChangeStyle,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const limitReached = dailyQuotaApplies && !!dailyQuota && dailyQuota.remaining <= 0;

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      onUpload(file, url);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <section className="bg-warm-50 px-4 pb-20 dark:bg-warm-950 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4 rounded-2xl border border-warm-200 bg-white p-4 dark:border-warm-800 dark:bg-warm-900"
        >
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.gradient} text-2xl`}
          >
            {style.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-xs text-warm-400">
              {country.emoji} {country.name} 선택 스타일
            </p>
            <p className="truncate font-semibold text-warm-900 dark:text-warm-50">{style.title}</p>
            <p className="truncate text-xs text-warm-500 dark:text-warm-400">{style.description}</p>
          </div>
          <button
            onClick={onChangeStyle}
            className="shrink-0 text-xs text-warm-400 transition-colors hover:text-primary"
          >
            변경
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="mb-2 text-2xl font-display font-bold text-warm-900 dark:text-warm-50">
            고양이 사진 업로드
          </h3>
          <p className="mb-6 text-sm text-warm-500 dark:text-warm-400">
            정면에 가깝고 얼굴과 털 무늬가 잘 보이는 사진일수록 결과가 좋아져요.
          </p>

          {dailyQuotaApplies && dailyQuota && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              오늘 AI 생성 잔여 {dailyQuota.remaining}회 / 총 {dailyQuota.limit}회
            </div>
          )}

          <AnimatePresence mode="wait">
            {!uploadedImage ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
                  dragging
                    ? 'scale-[1.01] border-primary bg-primary/5'
                    : 'border-warm-300 bg-white hover:border-primary/60 hover:bg-primary/3 dark:border-warm-700 dark:bg-warm-900'
                }`}
              >
                <Upload
                  className={`mb-3 h-10 w-10 transition-colors ${
                    dragging ? 'text-primary' : 'text-warm-300 dark:text-warm-600'
                  }`}
                />
                <p className="text-sm font-medium text-warm-600 dark:text-warm-300">
                  사진을 끌어다 놓거나 <span className="text-primary">클릭해서 선택</span>
                </p>
                <p className="mt-1 text-xs text-warm-400 dark:text-warm-600">
                  JPG, PNG, WEBP · 최대 10MB
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative overflow-hidden rounded-2xl border border-warm-200 bg-warm-100 dark:border-warm-800 dark:bg-warm-900"
              >
                <img
                  src={uploadedImage}
                  alt="업로드한 고양이 사진"
                  className="h-56 w-full object-cover"
                />
                <button
                  onClick={onClearUpload}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
                  사진 준비 완료
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { emoji: '🐱', label: '얼굴이 잘 보이는 사진' },
              { emoji: '💡', label: '밝고 선명한 사진' },
              { emoji: '🧶', label: '털색과 무늬가 보이는 사진' },
            ].map((tip) => (
              <div
                key={tip.label}
                className="flex flex-col items-center gap-1 rounded-xl border border-warm-100 bg-white p-2.5 text-center dark:border-warm-800 dark:bg-warm-900"
              >
                <span className="text-lg">{tip.emoji}</span>
                <span className="text-[11px] leading-tight text-warm-500 dark:text-warm-400">
                  {tip.label}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-500 dark:border-red-800 dark:bg-red-900/20"
              >
                안내: {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <Button
              size="xl"
              onClick={onGenerate}
              disabled={!uploadedImage || isGenerating || limitReached}
              loading={isGenerating}
              className="w-full"
              icon={<CatPawIcon size={18} tone="selected" />}
            >
              내 고양이로 만들기
            </Button>
            <p className="mt-3 text-center text-xs text-warm-400 dark:text-warm-600">
              {limitReached
                ? '오늘 한도를 모두 사용했어요. 내일 다시 생성할 수 있습니다.'
                : '비용 절감을 위해 중간 품질과 압축 JPEG로 생성됩니다.'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
