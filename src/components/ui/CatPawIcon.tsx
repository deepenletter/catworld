'use client';

import { useId } from 'react';

type CatPawTone = 'default' | 'hovered' | 'selected' | 'ambient';

type Palette = {
  toe: string;
  toeShadow: string;
  pad: string;
  padShadow: string;
  highlight: string;
};

const PALETTES: Record<CatPawTone, Palette> = {
  default: {
    toe: '#f4c430',
    toeShadow: '#c68d12',
    pad: '#f0b520',
    padShadow: '#b2780f',
    highlight: '#fff0a8',
  },
  hovered: {
    toe: '#ffd84d',
    toeShadow: '#d59f1b',
    pad: '#f8c331',
    padShadow: '#c78d12',
    highlight: '#fff4be',
  },
  selected: {
    toe: '#ffe36d',
    toeShadow: '#e1ad1f',
    pad: '#ffd250',
    padShadow: '#d49818',
    highlight: '#fff8cf',
  },
  ambient: {
    toe: '#f8d661',
    toeShadow: '#deb536',
    pad: '#f4c84f',
    padShadow: '#c89b1f',
    highlight: '#fff7d1',
  },
};

type Props = {
  size?: number;
  tone?: CatPawTone;
  className?: string;
};

export function CatPawIcon({
  size = 24,
  tone = 'default',
  className,
}: Props) {
  const gradientId = useId();
  const { toe, toeShadow, pad, padShadow, highlight } = PALETTES[tone];

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id={`${gradientId}-toe`} x1="18" y1="10" x2="18" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor={highlight} />
          <stop offset="1" stopColor={toe} />
        </linearGradient>
        <linearGradient id={`${gradientId}-pad`} x1="32" y1="28" x2="32" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor={highlight} />
          <stop offset="1" stopColor={pad} />
        </linearGradient>
      </defs>

      <g transform="rotate(-9 32 32)">
        <ellipse cx="17" cy="18.5" rx="6.4" ry="8.2" fill={`url(#${gradientId}-toe)`} stroke={toeShadow} strokeWidth="1.2" />
        <ellipse cx="28.5" cy="13.8" rx="6.6" ry="8.6" fill={`url(#${gradientId}-toe)`} stroke={toeShadow} strokeWidth="1.2" />
        <ellipse cx="40.5" cy="14.1" rx="6.6" ry="8.6" fill={`url(#${gradientId}-toe)`} stroke={toeShadow} strokeWidth="1.2" />
        <ellipse cx="51" cy="20" rx="6.1" ry="7.8" fill={`url(#${gradientId}-toe)`} stroke={toeShadow} strokeWidth="1.2" />

        <path
          d="M20.5 39.5C20.5 32.6 25.4 27 31.4 27c2.4 0 4.5.9 6 2.3 1.7-1.7 4.2-2.7 7-2.7 5.8 0 10.1 5 10.1 11.7 0 8.9-8.2 16-17.8 16-9 0-16.2-6.3-16.2-14.8Z"
          fill={`url(#${gradientId}-pad)`}
          stroke={padShadow}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M27.2 37.6c0-2.8 1.8-5.2 4.2-5.2 1.2 0 2.4.5 3.2 1.4.9-1 2.3-1.6 3.8-1.6 2.7 0 4.7 2.2 4.7 5.1"
          stroke={highlight}
          strokeLinecap="round"
          strokeWidth="1.4"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}
