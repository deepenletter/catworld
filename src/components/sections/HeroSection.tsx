'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Globe, Sparkles } from 'lucide-react';

type Props = {
  onStart: () => void;
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function HeroSection({ onStart }: Props) {
  return (
    <section
      id="hero"
      className="relative min-h-screen bg-hero-gradient dark:bg-none dark:bg-warm-950 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/5 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />
        {/* Floating paws */}
        {[
          { top: '15%', left: '8%', size: '2rem', delay: '0s', rot: '-12deg' },
          { top: '70%', right: '6%', size: '1.5rem', delay: '1.5s', rot: '20deg' },
          { top: '30%', right: '12%', size: '1.2rem', delay: '0.8s', rot: '5deg' },
          { top: '80%', left: '15%', size: '1.8rem', delay: '2s', rot: '-8deg' },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/20 dark:text-primary/15 select-none"
            style={{ top: p.top, left: (p as any).left, right: (p as any).right, fontSize: p.size, rotate: p.rot }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: parseFloat(p.delay) }}
          >
            🐾
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
        {/* Badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-primary/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI 기반 고양이 세계 여행 체험
        </motion.div>

        {/* Main headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-warm-900 dark:text-warm-50 leading-[1.08] mb-5"
        >
          우리집 고양이,
          <br />
          <span className="text-primary">세계 여행</span> 떠나다
        </motion.h1>

        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-lg sm:text-xl text-warm-600 dark:text-warm-300 max-w-xl leading-relaxed mb-10"
        >
          나라를 고르면 당신의 고양이가 그 나라 감성으로 변신합니다.
          <br className="hidden sm:block" />
          얼굴은 그대로, 스타일만 바뀌는 마법 같은 경험.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            size="xl"
            onClick={onStart}
            icon={<Globe className="w-5 h-5" />}
            className="min-w-[180px]"
          >
            나라 고르기
          </Button>
          <Button
            size="xl"
            variant="secondary"
            onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
          >
            갤러리 보기
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-16 flex items-center gap-8 text-warm-500 dark:text-warm-400"
        >
          {[
            { value: '6+', label: '여행 가능 국가' },
            { value: '24+', label: '스타일 템플릿' },
            { value: '∞', label: '가능성' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-display font-bold text-warm-800 dark:text-warm-100">
                {stat.value}
              </span>
              <span className="text-xs">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-warm-400"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-xs">아래로 스크롤</span>
        <div className="w-px h-8 bg-gradient-to-b from-warm-400 to-transparent" />
      </motion.div>
    </section>
  );
}
