'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import type { Country } from '@/types';
import { countries } from '@/data/countries';

const SPARKLES: [number, number, number, number][] = [
  [4, 8, 2.1, 0], [12, 3, 1.7, 0.4], [19, 14, 2.4, 0.8], [28, 5, 1.9, 0.2], [36, 10, 2.6, 1.0],
  [44, 2, 1.5, 0.6], [53, 8, 2.2, 0.1], [62, 4, 1.8, 0.9], [71, 12, 2.5, 0.3], [80, 6, 1.6, 0.7],
  [88, 9, 2.3, 0.5], [93, 3, 1.9, 1.2], [7, 22, 2.0, 0.8], [16, 28, 2.7, 0.2], [24, 18, 1.6, 1.1],
  [33, 24, 2.3, 0.4], [41, 30, 1.8, 0.9], [50, 19, 2.1, 0.0], [59, 26, 2.5, 0.6], [67, 21, 1.7, 1.3],
  [76, 28, 2.4, 0.3], [85, 16, 2.0, 0.7], [91, 24, 1.5, 1.0], [3, 38, 2.2, 0.5], [48, 40, 1.9, 0.2],
  [73, 35, 2.6, 0.8], [95, 42, 1.7, 0.1], [20, 50, 2.3, 1.4], [65, 48, 2.0, 0.6], [87, 55, 1.8, 0.3],
  [10, 60, 2.5, 0.9], [38, 65, 1.6, 0.4], [56, 58, 2.2, 1.1], [78, 62, 1.9, 0.0], [92, 68, 2.4, 0.7],
  [5, 75, 1.7, 0.3], [30, 80, 2.1, 0.8], [60, 78, 2.6, 0.2], [82, 82, 1.5, 1.2], [15, 88, 2.3, 0.5],
];

const CatGlobe3D = dynamic(
  () => import('@/components/globe/CatGlobe3D').then((module) => module.CatGlobe3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-float text-5xl">🐾</div>
          <p className="text-sm text-white/40">지구본을 불러오는 중입니다.</p>
        </div>
      </div>
    ),
  },
);

type Props = {
  onCountrySelect: (country: Country) => void;
  onBack: () => void;
};

export function GlobeSection({ onCountrySelect }: Props) {
  return (
    <section
      className="relative h-screen overflow-hidden"
      style={{
        background: '#060400',
        backgroundImage: 'url(/catworldbg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 z-0" style={{ background: 'rgba(4,3,0,0.52)' }} />

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {SPARKLES.map(([x, y, duration, delay], index) => (
          <div
            key={index}
            className="star-sparkle"
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: 2 + (index % 3),
              height: 2 + (index % 3),
              borderRadius: '50%',
              background: 'rgba(255,250,220,0.95)',
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 z-10">
        <div className="h-full w-full">
          <CatGlobe3D countries={countries} onCountrySelect={onCountrySelect} />
        </div>
      </div>

      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-6 pb-6 pt-20 text-center"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, transparent 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mb-2 text-3xl font-display font-bold text-white drop-shadow-lg sm:text-4xl">
            이번엔 어디로 떠날까요?
          </h2>
          <p className="hidden text-sm text-white/45 md:block">
            지구본에서 나라를 직접 클릭하거나 아래 목록에서 선택해 주세요.
          </p>
          <p className="text-sm text-white/45 md:hidden">
            모바일에서도 지구본을 돌려 보면서 나라를 선택할 수 있어요.
          </p>
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-14 sm:px-6"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
      >
        <div className="md:hidden">
          <p className="mb-3 text-center text-xs text-white/30">
            지구본이 불편하면 아래 나라 버튼으로 바로 이동할 수 있어요.
          </p>
          <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
            {countries.map((country, index) => (
              <motion.button
                key={country.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onCountrySelect(country)}
                className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/8 transition-all duration-200 hover:border-primary/60 hover:bg-white/12 active:scale-95"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${country.code}.png`}
                  alt={country.name}
                  width={28}
                  height={20}
                  className="rounded-sm object-cover"
                  style={{ width: 28, height: 20 }}
                />
                <span className="text-xs font-medium text-white">{country.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="hidden md:block">
          <p className="mb-3 text-center text-xs text-white/28">또는 아래에서 직접 선택</p>
          <div className="flex flex-wrap justify-center gap-2">
            {countries.map((country) => (
              <button
                key={country.slug}
                onClick={() => onCountrySelect(country)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/70 transition-all duration-200 hover:border-primary/50 hover:bg-white/14 hover:text-white active:scale-95"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${country.code}.png`}
                  alt={country.name}
                  width={22}
                  height={16}
                  className="rounded-sm object-cover"
                  style={{ width: 22, height: 16 }}
                />
                <span>{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
