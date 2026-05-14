'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Country, StyleCard } from '@/types';

type Props = {
  country: Country;
  style: StyleCard;
  uploadedImage: string | null;
  isGenerating: boolean;
  error: string | null;
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
  onUpload,
  onClearUpload,
  onGenerate,
  onChangeStyle,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      onUpload(file, url);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <section className="bg-warm-50 dark:bg-warm-950 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Selected style preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 flex items-center gap-4"
        >
          <div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-2xl shrink-0`}
          >
            {style.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-warm-400 mb-0.5">
              {country.emoji} {country.name} · 선택된 스타일
            </p>
            <p className="font-semibold text-warm-900 dark:text-warm-50 truncate">{style.title}</p>
            <p className="text-warm-500 dark:text-warm-400 text-xs truncate">{style.description}</p>
          </div>
          <button
            onClick={onChangeStyle}
            className="shrink-0 text-xs text-warm-400 hover:text-primary transition-colors"
          >
            변경
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-2xl font-display font-bold text-warm-900 dark:text-warm-50 mb-2">
            고양이 사진 업로드
          </h3>
          <p className="text-warm-500 dark:text-warm-400 text-sm mb-6">
            내 고양이 사진을 올려주세요. 얼굴이 잘 보일수록 결과가 좋아요.
          </p>

          {/* Upload area */}
          <AnimatePresence mode="wait">
            {!uploadedImage ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center h-56 ${
                  dragging
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-warm-300 dark:border-warm-700 bg-white dark:bg-warm-900 hover:border-primary/60 hover:bg-primary/3'
                }`}
              >
                <Upload className={`w-10 h-10 mb-3 transition-colors ${dragging ? 'text-primary' : 'text-warm-300 dark:text-warm-600'}`} />
                <p className="text-warm-600 dark:text-warm-300 font-medium text-sm">
                  사진을 끌어다 놓거나 <span className="text-primary">클릭해서 선택</span>
                </p>
                <p className="text-warm-400 dark:text-warm-600 text-xs mt-1">
                  JPG, PNG, WEBP · 최대 10MB
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative rounded-2xl overflow-hidden bg-warm-100 dark:bg-warm-900 border border-warm-200 dark:border-warm-800"
              >
                <img
                  src={uploadedImage}
                  alt="업로드된 고양이"
                  className="w-full h-56 object-cover"
                />
                <button
                  onClick={onClearUpload}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  ✓ 사진 준비됨
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Photo tips */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { emoji: '😻', label: '얼굴이 잘 보이는 사진' },
              { emoji: '☀️', label: '밝고 선명한 사진' },
              { emoji: '🎨', label: '털무늬가 잘 보이는 사진' },
            ].map((tip) => (
              <div
                key={tip.label}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 text-center"
              >
                <span className="text-lg">{tip.emoji}</span>
                <span className="text-warm-500 dark:text-warm-400 text-[11px] leading-tight">{tip.label}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800"
              >
                ⚠️ {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Generate button */}
          <div className="mt-6">
            <Button
              size="xl"
              onClick={onGenerate}
              disabled={!uploadedImage || isGenerating}
              loading={isGenerating}
              className="w-full"
              icon={<span className="text-lg">🐾</span>}
            >
              내 고양이로 만들기
            </Button>
            <p className="text-center text-warm-400 dark:text-warm-600 text-xs mt-3">
              약 10–30초 소요됩니다
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
