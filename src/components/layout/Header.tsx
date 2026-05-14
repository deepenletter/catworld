'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { AppPhase } from '@/types';

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
  const isGlobeBg = phase === 'globe' || phase === 'generating';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        isGlobeBg
          ? 'bg-black/80 border-b border-white/5 backdrop-blur-md'
          : 'bg-warm-50/90 dark:bg-warm-900/90 border-b border-warm-200/60 dark:border-warm-700/40 backdrop-blur-md'
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
          <span className="text-lg leading-none">🐾</span>
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
                  : 'text-warm-600 dark:text-warm-300 hover:text-warm-900 dark:hover:text-warm-50'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`md:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              isGlobeBg
                ? 'text-white/70 hover:bg-white/10'
                : 'text-warm-600 hover:bg-warm-100 dark:text-warm-300 dark:hover:bg-warm-800'
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
            className="md:hidden overflow-hidden border-t border-warm-200/60 dark:border-warm-700/40 bg-warm-50/95 dark:bg-warm-900/95 backdrop-blur-md"
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
                  className="py-2.5 px-3 rounded-lg text-sm font-medium text-warm-700 dark:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
