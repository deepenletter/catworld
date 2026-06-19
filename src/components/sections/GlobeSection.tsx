'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { CatPawIcon } from '@/components/ui/CatPawIcon';
import type { Country } from '@/types';
import { countries } from '@/data/countries';
import { extractCustomCountries, extractEnabledCountrySlugs, type CustomCountryData } from '@/lib/adminConfig';

function customToCountry(c: CustomCountryData) {
  return {
    slug: c.slug,
    name: c.name,
    nameEn: c.nameEn,
    emoji: '',
    code: c.code,
    lat: c.lat,
    lng: c.lng,
    accentColor: '#D97706',
    description: '',
    styles: [] as never[],
  };
}

// Painted-globe geometry inside public/newcat.png (1672×941):
//   center (832, 546)  radius 319  → the live 3D globe is aligned to sit on top of it.
const STAGE_W = 1672;
const STAGE_H = 941;

const CatGlobe3D = dynamic(
  () => import('@/components/globe/CatGlobe3D').then((module) => module.CatGlobe3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center animate-float">
            <CatPawIcon size={54} tone="ambient" className="opacity-80" />
          </div>
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
  const [activeCountries, setActiveCountries] = useState<Country[]>(countries);
  const [zooming, setZooming] = useState(false);

  useEffect(() => {
    fetch('/api/admin/config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: unknown) => {
        const custom = extractCustomCountries(data).map(customToCountry);
        const all = [...countries, ...custom];
        const slugs = extractEnabledCountrySlugs(data);
        if (slugs && slugs.length > 0) {
          setActiveCountries(all.filter((c) => slugs.includes(c.slug)));
        } else if (custom.length > 0) {
          setActiveCountries(all);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative h-screen overflow-hidden" style={{ background: '#04060f' }}>
      {/* Aspect-locked stage: keeps the photo, the live 3D globe, and the cat
          overlay perfectly aligned no matter the screen size (acts like
          background-size: cover, but for every layer at once). */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `max(100vw, calc(100vh * ${STAGE_W} / ${STAGE_H}))`,
          height: `max(100vh, calc(100vw * ${STAGE_H} / ${STAGE_W}))`,
        }}
      >
        {/* Space + cat photo backdrop (the painted globe is hidden behind the 3D one) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/newcat.png"
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        />

        {/* Live 3D rotating globe — full-stage canvas so dragging works
            everywhere. The globe is sized (camera distance) + placed (view offset)
            in CatGlobe3D to tuck under the cat's paws. Camera projection keeps it
            horizontally centred, so the cat (also centred) always lines up. */}
        <div className="absolute inset-0">
          <CatGlobe3D
            countries={activeCountries}
            onCountrySelect={onCountrySelect}
            onZoomStart={() => setZooming(true)}
          />
        </div>

        {/* Cat (head + paws) hugging the globe, layered in front; fades out on zoom.
            Scaled to match the globe size, pivoting near the paw/hug line (21%). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cat-overlay.png"
          alt=""
          aria-hidden
          draggable={false}
          style={{
            zIndex: 5,
            transform: 'translateY(4%) scale(0.91)',
            transformOrigin: '50% 21%',
            opacity: zooming ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        />
      </div>

      <div
        className={`pointer-events-none absolute left-0 right-0 top-0 z-20 px-6 pb-12 pt-20 text-center transition-opacity duration-300 ${zooming ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.62) 48%, transparent 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            className="mb-2 text-3xl font-display font-bold text-white sm:text-4xl"
            style={{ textShadow: '0 2px 14px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.9)' }}
          >
            어디로 떠날까냥?
          </h2>
          <p className="text-sm text-white/70" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
            원하는 나라를 선택하라옹
          </p>
        </motion.div>
      </div>

      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-14 sm:px-6 transition-opacity duration-300 ${zooming ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
      >
        <div className="md:hidden">
          <p className="mb-3 text-center text-xs text-white/30">
            지구본이 불편하면 아래 나라 버튼으로 바로 이동할 수 있어요.
          </p>
          <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
            {activeCountries.map((country, index) => (
              <motion.button
                key={country.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onCountrySelect(country)}
                className="pointer-events-auto flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/8 transition-all duration-200 hover:border-primary/60 hover:bg-white/12 active:scale-95"
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
            {activeCountries.map((country) => (
              <button
                key={country.slug}
                onClick={() => onCountrySelect(country)}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/70 transition-all duration-200 hover:border-primary/50 hover:bg-white/14 hover:text-white active:scale-95"
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
