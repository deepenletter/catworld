'use client';

type Props = {
  size?: number;
  tone?: 'default' | 'hovered' | 'selected' | 'ambient';
  className?: string;
};

export function CatPawIcon({ size = 24, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/foot.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'inline-block' }}
    />
  );
}
