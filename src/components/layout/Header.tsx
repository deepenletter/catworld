'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
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
};

const NAV = [
  { label: '나라 선택', href: '#globe' },
  { label: '스타일 갤러리', href: '#gallery' },
  { label: 'FAQ', href: '#faq' },
];

export function Header({ phase, onLogoClick, onGlobeClick }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [activeCountries, setActiveCountries] = useState<Country[]>(countries);
  const isGlobeBg = phase === 'globe' || phase === 'generating';

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
            {/* 세계나라냥 버튼 */}
            <button
              onClick={() => setCountryModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isGlobeBg
                  ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15'
                  : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
              }`}
            >
              <CatPawIcon size={13} tone="default" />
              <span className="hidden sm:inline">세계나라냥</span>
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

      {/* 세계나라냥 모달 */}
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
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100">
                <div className="flex items-center gap-2">
                  <CatPawIcon size={18} tone="hovered" />
                  <span className="font-display font-bold text-warm-900">세계나라냥</span>
                  <span className="text-xs text-warm-400 ml-1">{activeCountries.length}개 나라</span>
                </div>
                <button
                  onClick={() => setCountryModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-warm-100 transition-colors text-warm-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 나라 목록 */}
              <div className="max-h-80 overflow-y-auto py-2">
                {activeCountries.map((country) => (
                  <div
                    key={country.slug}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-warm-50 transition-colors"
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
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
