'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type {
  AdminCountryConfig,
  AdminTemplate,
  Country,
  StyleCard as StyleCardType,
} from '@/types';
import { StyleCard } from '@/components/cards/StyleCard';
import { getTemplateGenerationMode, normalizeAdminConfig } from '@/lib/adminConfig';
import { setAdminTemplates } from '@/lib/templateStore';

type Props = {
  country: Country;
  selectedStyle: StyleCardType | null;
  onStyleSelect: (style: StyleCardType) => void;
  onBack: () => void;
};

function adminTemplateToStyleCard(template: AdminTemplate): StyleCardType {
  const generationMode = getTemplateGenerationMode(template);
  const isComposite = generationMode === 'composite';

  return {
    id: template.id,
    title: template.title,
    description: isComposite
      ? '얼굴 합성 템플릿'
      : 'AI 편집 템플릿',
    gradient: isComposite ? 'from-slate-800 to-slate-900' : 'from-purple-700 to-fuchsia-500',
    accentColor: isComposite ? '#475569' : '#9333EA',
    emoji: isComposite ? '😺' : '✨',
    tags: isComposite ? ['템플릿', '얼굴합성'] : ['AI', '편집'],
    image: template.url,
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
      .then((data) => {
        if (cancelled) return;

        const normalized = normalizeAdminConfig(data);
        setAdminConfig(normalized);
        setAdminTemplates(Object.values(normalized).flat());
      })
      .catch(() => {
        if (!cancelled) {
          setAdminConfig({});
          setAdminTemplates([]);
        }
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const adminTemplates: AdminTemplate[] = adminConfig?.[country.slug] ?? [];
  const hasAdminTemplates = adminTemplates.length > 0;
  const styleCards: StyleCardType[] = hasAdminTemplates
    ? adminTemplates.map(adminTemplateToStyleCard)
    : country.styles;

  return (
    <section
      className="min-h-screen pt-20 pb-16 px-4 sm:px-6"
      style={{ background: 'linear-gradient(160deg, #FFFDE7 0%, #FFF9C4 45%, #FFFBCC 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w80/${country.code}.png`}
                alt={`${country.name} flag`}
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
              ? '관리자 템플릿을 불러오는 중입니다.'
              : hasAdminTemplates
              ? `${adminTemplates.length}개의 관리자 템플릿 중 하나를 선택해 주세요.`
              : '기본 스타일 카드 중 하나를 선택해 주세요.'}
          </p>
        </motion.div>

        {configLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-40 rounded-2xl bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        )}

        {!configLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {styleCards.map((style, index) => (
              <StyleCard
                key={style.id}
                style={style}
                isSelected={selectedStyle?.id === style.id}
                onSelect={onStyleSelect}
                index={index}
              />
            ))}
          </div>
        )}

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
              이 나라는 아직 관리자 템플릿이 없습니다. 기본 카드 목록으로 보여드리고 있습니다.
            </p>
          </motion.div>
        )}

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
          <span className="text-xl">💡</span>
          <p className="text-warm-700 text-sm leading-relaxed">
            {hasAdminTemplates
              ? '관리자 템플릿이 있으면 선택한 템플릿 방식으로 바로 결과를 만듭니다. 얼굴 합성 모드는 빠르고 배포도 간단합니다.'
              : '관리자 템플릿이 없으면 기존 스타일 카드 흐름을 사용합니다.'}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
