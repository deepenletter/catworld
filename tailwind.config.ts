import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F5C518',
          light: '#FFD966',
          dark: '#D4A017',
          50: '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFEE99',
          300: '#FFE066',
          400: '#FFD033',
          500: '#F5C518',
          600: '#D4A017',
          700: '#A67C00',
          800: '#7A5C00',
          900: '#4D3A00',
        },
        warm: {
          50: '#FAF8F4',
          100: '#F5EFE6',
          200: '#EDE0D3',
          300: '#E0CCBA',
          400: '#C4A882',
          500: '#A88060',
          600: '#8B5E3C',
          700: '#6B4423',
          800: '#4A2D12',
          900: '#2A1604',
          950: '#140D04',
        },
        globe: {
          bg: '#07111D',
          line: 'rgba(212, 185, 126, 0.22)',
          marker: '#D4956A',
          glow: '#FFB347',
        },
      },
      fontFamily: {
        sans: ['var(--font-gowun)', 'system-ui', 'sans-serif'],
        display: ['var(--font-nanum)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at 60% 40%, #FFFDE7 0%, #FFFBCC 60%, #FFF5B3 100%)',
        'globe-bg': 'radial-gradient(ellipse at center, #0D1F35 0%, #07111D 70%)',
        'card-hover': 'linear-gradient(135deg, rgba(245,197,24,0.08) 0%, rgba(255,217,102,0.12) 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 2s infinite',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'slide-up': 'slide-up 0.7s cubic-bezier(0.22,1,0.36,1)',
        'slide-down': 'slide-down 0.5s cubic-bezier(0.22,1,0.36,1)',
        'fade-in': 'fade-in 0.6s ease-out',
        'spin-slow': 'spin 25s linear infinite',
        'cat-blink': 'cat-blink 4s ease-in-out infinite',
        'marker-pulse': 'marker-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'orbit': 'orbit 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'cat-blink': {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' },
        },
        'marker-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,149,106,0.6)' },
          '50%': { boxShadow: '0 0 0 12px rgba(212,149,106,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        orbit: {
          from: { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          to: { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        },
      },
      boxShadow: {
        'glow-primary': '0 0 30px rgba(245,197,24,0.4)',
        'glow-primary-lg': '0 0 60px rgba(245,197,24,0.45)',
        'card': '0 2px 20px rgba(44,28,16,0.08)',
        'card-hover': '0 8px 40px rgba(44,28,16,0.14)',
        'globe': '0 0 120px rgba(13,29,55,0.9), inset 0 0 60px rgba(20,50,90,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
