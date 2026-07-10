'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { CatPawIcon } from '@/components/ui/CatPawIcon';
import { countries } from '@/data/countries';
import { extractCustomCountries, extractEnabledCountrySlugs } from '@/lib/adminConfig';
import type { AppPhase, Country } from '@/types';

type CustomCountryData = ReturnType<typeof extractCustomCountries>[number];

function customToCountry(c: CustomCountryData): Country {
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

type Props = {
  phase: AppPhase;
  onLogoClick: () => void;
  onGlobeClick: () => void;
  onCountrySelect: (country: Country) => void;
};

const NAV = [
  { label: '나라 선택', href: '#globe' },
  { label: '스타일 갤러리', href: '#gallery' },
  { label: 'FAQ', href: '#faq' },
  {
    label: '집사 이야기',
    href: 'https://maddening-laugh-c23.notion.site/1e434d04ef1c8080af86e7413b9b2a4f',
  },
];

export function Header({ phase, onLogoClick, onGlobeClick, onCountrySelect }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [travelingTo, setTravelingTo] = useState<Country | null>(null);
  const [activeCountries, setActiveCountries] = useState<Country[]>(countries);
  const isGlobeBg = phase === 'globe' || phase === 'generating';

  // 나라 클릭 → "다른나라 간다냥..." 로딩 후 해당 나라 스타일 갤러리로 이동
  useEffect(() => {
    if (!travelingTo) return;
    const t = setTimeout(() => {
      onCountrySelect(travelingTo);
      setCountryModalOpen(false);
      setMenuOpen(false);
      setTravelingTo(null);
    }, 1400);
    return () => clearTimeout(t);
  }, [travelingTo, onCountrySelect]);

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
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          isGlobeBg
            ? 'bg-black/80 border-b border-white/5 backdrop-blur-md'
            : 'bg-warm-50/90 border-b border-warm-200/60 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 group"
            aria-label="세계냥주 홈으로"
          >
            <span className="text-xl font-display font-bold text-primary tracking-tight group-hover:opacity-80 transition-opacity">
              세계냥주
            </span>
            <CatPawIcon size={18} tone="hovered" className="shrink-0" />
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={item.href === '#globe' ? (e) => { e.preventDefault(); onGlobeClick(); } : undefined}
                className={`text-sm font-medium transition-colors ${
                  isGlobeBg
                    ? 'text-white/70 hover:text-white'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* 공항갈까냥 버튼 */}
            <button
              onClick={() => setCountryModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-all ${
                isGlobeBg
                  ? 'border border-white/15 bg-white/10 text-white hover:bg-white/20'
                  : 'border border-primary-700/30 bg-primary text-warm-900 shadow-sm hover:bg-primary-light'
              }`}
            >
              <CatPawIcon size={15} className={isGlobeBg ? '' : 'brightness-0 opacity-75'} />
              <span>공항갈까냥</span>
            </button>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`md:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                isGlobeBg
                  ? 'text-white/70 hover:bg-white/10'
                  : 'text-warm-600 hover:bg-warm-100'
              }`}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-warm-200/60 bg-warm-50/95 backdrop-blur-md"
            >
              <nav className="flex flex-col px-4 py-3 gap-1">
                {NAV.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={() => {
                      setMenuOpen(false);
                      if (item.href === '#globe') onGlobeClick();
                    }}
                    className="py-2.5 px-3 rounded-lg text-sm font-medium text-warm-700 hover:bg-warm-100 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 공항갈까냥 — PC 우측 드로어 */}
      <AnimatePresence>
        {countryModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={() => setCountryModalOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 z-[70] flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
            >
              {/* 드로어 헤더 */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100">
                <div className="flex items-center gap-2">
                  <CatPawIcon size={18} tone="hovered" />
                  <span className="font-display font-bold text-warm-900">공항갈까냥</span>
                  <span className="text-xs text-warm-400 ml-1">{activeCountries.length}개 나라</span>
                </div>
                <button
                  onClick={() => setCountryModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-warm-100 transition-colors text-warm-500"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="px-5 pt-3 pb-1 text-xs text-warm-400">나라를 선택하면 스타일 갤러리로 이동해요</p>

              {/* 나라 목록 (클릭 시 해당 나라 스타일 갤러리로 이동) */}
              <div className="flex-1 overflow-y-auto py-2">
                {activeCountries.map((country) => (
                  <button
                    key={country.slug}
                    onClick={() => setTravelingTo(country)}
                    disabled={!!travelingTo}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-warm-50 active:bg-warm-100 disabled:opacity-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://flagcdn.com/w40/${country.code}.png`}
                      alt={country.name}
                      width={28}
                      height={20}
                      style={{ width: 28, height: 20, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
                    />
                    <span className="text-sm font-medium text-warm-800">{country.name}</span>
                    <ChevronRight className="ml-auto w-4 h-4 text-warm-300" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* "다른나라 간다냥..." 이동 로딩 오버레이 */}
      <AnimatePresence>
        {travelingTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/85 px-6 text-center backdrop-blur-md"
          >
            <div className="relative mb-8">
              <motion.div
                animate={{ scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="flex justify-center"
              >
                <CatPawIcon size={74} tone="selected" />
              </motion.div>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3 + i * 0.7, repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
                  style={{ originX: '50%', originY: '50%' }}
                >
                  <div
                    className="absolute"
                    style={{ transform: `translate(-50%, -50%) translateX(${56 + i * 18}px)`, opacity: 0.6 - i * 0.12 }}
                  >
                    <CatPawIcon size={16 - i * 2} tone={i === 0 ? 'hovered' : 'ambient'} />
                  </div>
                </motion.div>
              ))}
            </div>

            <h2 className="font-display text-2xl font-bold text-white">다른나라 간다냥...</h2>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w40/${travelingTo.code}.png`}
                alt={travelingTo.name}
                width={22}
                height={16}
                style={{ width: 22, height: 16, objectFit: 'cover', borderRadius: 3 }}
              />
              <span>{travelingTo.name} 스타일 갤러리로 이동 중</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
