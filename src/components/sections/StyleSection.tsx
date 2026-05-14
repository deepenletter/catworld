'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { Country, StyleCard as StyleCardType, AdminCountryConfig, AdminTemplate } from '@/types';
import { StyleCard } from '@/components/cards/StyleCard';
import { setAdminTemplates } from '@/lib/templateStore';

type Props = {
  country: Country;
  selectedStyle: StyleCardType | null;
  onStyleSelect: (style: StyleCardType) => void;
  onBack: () => void;
};

function adminTemplateToStyleCard(t: AdminTemplate): StyleCardType {
  return {
    id: t.id,
    title: t.title,
    description: `밝기: ${t.brightness}%`,
    gradient: 'from-slate-800 to-slate-900',
    accentColor: '#888888',
    emoji: '🌍',
    tags: [],
    image: t.url,
    promptTemplate: '',
    identityLockInstruction: '',
    styleStrength: 0.7,
    facePreservePriority: 'high',
  };
}

export function StyleSection({ country, selectedStyle, onStyleSelect, onBack }: Props) {
  const [adminConfig, setAdminConfig] = useState<AdminCountryConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setConfigLoading(true);
    fetch('/api/admin/config')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: AdminCountryConfig) => {
        if (cancelled) return;
        setAdminConfig(data);
        // Register all templates into the store so compositing can look them up
        const allTemplates = Object.values(data).flat();
        setAdminTemplates(allTemplates);
      })
      .catch(() => {
        if (!cancelled) setAdminConfig({});
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const adminTemplates: AdminTemplate[] = adminConfig?.[country.slug] ?? [];
  const hasAdminTemplates = adminTemplates.length > 0;

  // Determine which style cards to show
  const styleCards: StyleCardType[] = hasAdminTemplates
    ? adminTemplates.map(adminTemplateToStyleCard)
    : country.styles;

  return (
    <section
      className="min-h-screen pt-20 pb-16 px-4 sm:px-6"
      style={{ background: 'linear-gradient(160deg, #FFFDE7 0%, #FFF9C4 45%, #FFFBCC 100%)' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* 뒤로가기 */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-warm-500 hover:text-warm-800 text-sm transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            다른 나라 선택
          </button>
        </motion.div>

        {/* 나라 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-3">
            {/* 국기 이미지 */}
            <div className="relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w80/${country.code}.png`}
                alt={`${country.name} 국기`}
                className="rounded-lg object-cover shadow-md"
                style={{ height: 52, width: 'auto', minWidth: 72 }}
              />
              <div className="absolute inset-0 rounded-lg ring-1 ring-black/10" />
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-warm-900 leading-tight">
                {country.name}
              </h2>
              <p className="text-warm-600 text-sm mt-0.5">{country.description}</p>
            </div>
          </div>

          <p className="text-warm-700 text-base mt-5 font-medium">
            {configLoading
              ? '스타일을 불러오는 중...'
              : hasAdminTemplates
              ? `${adminTemplates.length}가지 템플릿 중 하나를 선택하면, 내 고양이 사진이 합성됩니다.`
              : '4가지 스타일 중 하나를 선택하면, 내 고양이가 그 감성으로 변신합니다.'}
          </p>
        </motion.div>

        {/* Loading skeleton */}
        {configLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Style / template grid */}
        {!configLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {styleCards.map((style, i) => (
              <StyleCard
                key={style.id}
                style={style}
                isSelected={selectedStyle?.id === style.id}
                onSelect={onStyleSelect}
                index={i}
              />
            ))}
          </div>
        )}

        {/* No templates warning (admin templates exist but none for this country) */}
        {!configLoading && adminConfig !== null && Object.keys(adminConfig).length > 0 && !hasAdminTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-start gap-3 p-4 rounded-2xl border"
            style={{
              background: 'rgba(239,68,68,0.06)',
              borderColor: 'rgba(239,68,68,0.25)',
            }}
          >
            <span className="text-xl">⚠️</span>
            <p className="text-red-700 text-sm leading-relaxed">
              관리자가 아직 이 나라의 템플릿을 설정하지 않았습니다. 스타일을 선택하면 기본 카드가 표시됩니다.
            </p>
          </motion.div>
        )}

        {/* 얼굴 보존 안내 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-start gap-3 p-4 rounded-2xl border"
          style={{
            background: 'rgba(245,197,24,0.12)',
            borderColor: 'rgba(245,197,24,0.4)',
          }}
        >
          <span className="text-xl">🐱</span>
          <p className="text-warm-700 text-sm leading-relaxed">
            {hasAdminTemplates ? (
              <>
                <strong className="text-warm-900">캔버스 합성 기술</strong>
                &nbsp;— 업로드한 고양이 사진을 템플릿 이미지에 자연스럽게 합성합니다.
                얼굴 영역이 설정된 템플릿에서 더 정확한 결과를 얻을 수 있습니다.
              </>
            ) : (
              <>
                <strong className="text-warm-900">얼굴 정체성 보존 기술</strong>
                &nbsp;— 털 색, 눈 색, 얼굴형 등 고양이 고유의 특징은 최대한 유지됩니다.
                스타일 요소(배경·의상·소품·조명)만 바뀝니다.
              </>
            )}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
