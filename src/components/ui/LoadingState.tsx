'use client';

import { motion } from 'framer-motion';
import type { Country, StyleCard } from '@/types';

type Props = {
  progress: number;
  country: Country | null;
  style: StyleCard | null;
};

const STAGES = [
  { min: 0, label: '고양이 얼굴 분석 중...' },
  { min: 20, label: '털 패턴과 눈 색 기억 중...' },
  { min: 40, label: '세계 여행 준비 중...' },
  { min: 60, label: '스타일 마법 적용 중...' },
  { min: 80, label: '마지막 터치 중...' },
  { min: 95, label: '거의 다 됐어요!' },
];

function currentLabel(progress: number) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (progress >= STAGES[i].min) return STAGES[i].label;
  }
  return STAGES[0].label;
}

export function LoadingState({ progress, country, style }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Paw animation */}
      <div className="relative mb-10">
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl"
        >
          🐾
        </motion.div>

        {/* Orbit paws */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 text-xl"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3 + i * 0.7,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.5,
            }}
            style={{ originX: '50%', originY: '50%' }}
          >
            <span
              className="absolute"
              style={{
                transform: `translate(-50%, -50%) translateX(${60 + i * 20}px)`,
                fontSize: `${18 - i * 3}px`,
                opacity: 0.6 - i * 0.1,
              }}
            >
              🐾
            </span>
          </motion.div>
        ))}
      </div>

      {/* Country + style info */}
      {country && style && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-warm-500 dark:text-warm-400 text-sm mb-1">
            {country.emoji} {country.name} · {style.emoji} {style.title}
          </p>
        </motion.div>
      )}

      <h2 className="text-2xl font-display font-semibold text-warm-900 dark:text-warm-50 mb-2">
        변신 중이에요
      </h2>
      <p className="text-warm-500 dark:text-warm-400 mb-10 text-sm">
        고양이 얼굴 정체성은 그대로 유지되며, 스타일만 바뀝니다.
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-warm-400 mb-2">
          <span>{currentLabel(progress)}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-warm-100 dark:bg-warm-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      <p className="mt-8 text-xs text-warm-400 dark:text-warm-600">
        약 10–30초 소요됩니다
      </p>
    </div>
  );
}
