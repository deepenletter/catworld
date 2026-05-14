'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'xl';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-warm-900 shadow-md hover:bg-primary-dark hover:shadow-glow-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-warm-100 text-warm-800 border border-warm-200 hover:bg-warm-200 active:scale-95 disabled:opacity-50',
  outline:
    'border-2 border-primary text-primary hover:bg-primary hover:text-white active:scale-95 disabled:opacity-50',
  ghost:
    'text-warm-600 hover:text-warm-900 hover:bg-warm-100 active:scale-95 disabled:opacity-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-7 text-base rounded-xl gap-2',
  xl: 'h-14 px-9 text-lg rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center font-medium transition-all duration-200',
            variants[variant],
            sizes[size],
            className
          )
        )}
        {...rest}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
