import Link from 'next/link';
import type { Metadata } from 'next';

type SharedPageProps = {
  searchParams: {
    image?: string;
    title?: string;
    description?: string;
  };
};

function sanitizeText(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return value.slice(0, 160);
}

export function generateMetadata({ searchParams }: SharedPageProps): Metadata {
  const title = sanitizeText(searchParams.title, '세계냥주 공유 결과');
  const description = sanitizeText(
    searchParams.description,
    '세계냥주에서 만든 고양이 변신 결과를 확인해 보세요.',
  );
  const image = searchParams.image;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function SharedPage({ searchParams }: SharedPageProps) {
  const title = sanitizeText(searchParams.title, '세계냥주 공유 결과');
  const description = sanitizeText(
    searchParams.description,
    '세계냥주에서 만든 고양이 변신 결과입니다.',
  );
  const image = searchParams.image;

  return (
    <main className="min-h-screen bg-[#fff8e8] px-4 py-12 text-[#392314]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#cc7a00]">
            Catworld Share
          </p>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-3 text-sm text-[#6c513f]">{description}</p>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[#f0d4ae] bg-white shadow-[0_24px_70px_rgba(100,58,18,0.12)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={title}
              className="w-full object-cover"
            />
          ) : (
            <div className="flex h-[360px] items-center justify-center bg-[#fff2d1] text-sm text-[#8b6d56]">
              공유 이미지를 찾지 못했습니다.
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-[#f0d4ae] bg-white/80 p-5 text-center shadow-[0_16px_50px_rgba(100,58,18,0.08)]">
          <p className="text-sm text-[#6c513f]">
            이 결과는 Catworld에서 만들어졌습니다. 직접 고양이 사진으로 새 결과를 만들어 보세요.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-full bg-[#f08a00] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#da7c00]"
          >
            Catworld로 이동
          </Link>
        </div>
      </div>
    </main>
  );
}
