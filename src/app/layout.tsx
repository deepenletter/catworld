import type { Metadata } from 'next';
import { Gowun_Dodum, Nanum_Myeongjo } from 'next/font/google';
import './globals.css';

const gowunDodum = Gowun_Dodum({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-gowun',
  display: 'swap',
});

const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-nanum',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '세계냥주 — 우리집 고양이, 세계 여행 떠나다',
  description:
    '나라를 고르면 당신의 고양이가 그 나라 감성으로 변신합니다. AI 기반 고양이 세계 여행 체험.',
  keywords: ['고양이', '세계여행', 'AI', '이미지생성', '반려동물', '세계냥주'],
  openGraph: {
    title: '세계냥주',
    description: '우리집 고양이, 세계 여행 떠나다',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${gowunDodum.variable} ${nanumMyeongjo.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
