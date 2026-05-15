'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { StyleCard as StyleCardType } from '@/types';
import { clsx } from 'clsx';

type Props = {
  style: StyleCardType;
  isSelected: boolean;
  onSelect: (style: StyleCardType) => void;
  index: number;
};

export function StyleCard({ style, isSelected, onSelect, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        'group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300',
        'border-2 bg-white/95',
        isSelected
          ? 'border-primary shadow-glow-primary scale-[1.02]'
          : 'border-warm-200/60 shadow-card hover:shadow-card-hover hover:border-primary/40 hover:scale-[1.015]'
      )}
      onClick={() => onSelect(style)}
    >
      {/* Preview image / gradient */}
      <div
        className={clsx(
          'relative aspect-[3/4] overflow-hidden',
          style.image ? 'bg-black' : `bg-gradient-to-br ${style.gradient}`
        )}
      >
        {/* Actual style image when provided */}
        {style.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={style.image}
            alt={style.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Pattern overlay (only when no image) */}
        {!style.image && (
          <div className="absolute inset-0 opacity-20">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                 radial-gradient(circle at 80% 70%, rgba(0,0,0,0.2) 0%, transparent 50%)`,
              }}
            />
          </div>
        )}

        {/* Emoji large (hidden when image is present) */}
        {!style.image && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl drop-shadow-lg select-none opacity-80 group-hover:scale-110 transition-transform duration-500">
              {style.emoji}
            </span>
          </div>
        )}

        {/* Cat silhouette suggestion */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Selected badge */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md"
          >
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </motion.div>
        )}

        {/* Tags */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {style.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="bg-black/30 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-semibold text-warm-900 text-base mb-1 group-hover:text-primary-dark transition-colors">
          {style.title}
        </h3>
        <p className="text-warm-500 text-xs leading-relaxed line-clamp-2">
          {style.description}
        </p>

        {/* Select indicator */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {style.tags.slice(2).map((tag) => (
              <span
                key={tag}
                className="bg-primary-100 text-warm-600 text-[10px] px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <span
            className={clsx(
              'text-xs font-medium transition-colors',
              isSelected ? 'text-primary' : 'text-warm-400 group-hover:text-primary'
            )}
          >
            {isSelected ? '선택됨 ✓' : '선택하기 →'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
