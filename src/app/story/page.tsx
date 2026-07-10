import Link from 'next/link';
import type { Metadata } from 'next';
import { CatPawIcon } from '@/components/ui/CatPawIcon';

const NOTION_URL =
  'https://maddening-laugh-c23.notion.site/1e434d04ef1c8080af86e7413b9b2a4f';

export const metadata: Metadata = {
  title: '이 사이트가 만들어진 이유 - 세계냥주',
  description:
    '길냥이 13마리와 함께 사는 한 사람의 이야기. 세계냥주가 만들어진 이유를 소개합니다.',
  openGraph: {
    title: '이 사이트가 만들어진 이유',
    description: '길냥이 13마리와 함께 사는 한 사람의 이야기.',
    type: 'article',
  },
};

function PawDivider() {
  return (
    <div className="my-10 flex items-center justify-center gap-3 opacity-60">
      <span className="h-px w-16 bg-warm-300 dark:bg-warm-700" />
      <CatPawIcon size={16} tone="ambient" />
      <span className="h-px w-16 bg-warm-300 dark:bg-warm-700" />
    </div>
  );
}

export default function StoryPage() {
  return (
    <main className="min-h-screen bg-warm-50 px-4 py-16 dark:bg-warm-950 sm:px-6">
      <article className="mx-auto max-w-xl">
        {/* 헤더 */}
        <header className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <CatPawIcon size={40} tone="hovered" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Our Story
          </p>
          <h1 className="font-display text-3xl font-bold leading-snug text-warm-900 dark:text-warm-50 sm:text-4xl">
            이 사이트가
            <br />
            만들어진 이유
          </h1>
        </header>

        {/* 본문 */}
        <div className="space-y-6 text-[15px] leading-loose text-warm-700 dark:text-warm-300">
          <p>
            여기, 고양이를 세상에서 제일 사랑하는 사람이 한 명 있습니다.
          </p>
          <p>
            그 사람의 집에는 지금 <strong className="text-warm-900 dark:text-warm-50">열세 마리의 고양이</strong>가
            살아요. 전부 길에서 만난 아이들입니다. 한때는 더 많은 아이들과
            함께였고, 먼저 떠난 친구들의 자리는 지금도 마음속에 그대로
            남아 있어요.
          </p>
          <p>
            새벽이면 아파트 근처를 배회하는 친구들에게 밥을 챙겨주고, 주머니엔
            늘 츄르가 하나쯤 들어 있습니다. 여행을 가서도 길 위의 동물들을
            그냥 지나치지 못하고, 사는 물건은 죄다 고양이가 그려진 것들뿐이에요.
          </p>
          <p>
            그런데 그 사람은 늘 미안해합니다. 현실 때문에{' '}
            <strong className="text-warm-900 dark:text-warm-50">
              모든 친구들을 거두지 못해서요.
            </strong>{' '}
            손을 내밀지 못하고 돌아서는 날이면, 그 마음이 오래 남는대요.
          </p>

          <PawDivider />

          <p>
            그 사람의 꿈은 언젠가 <strong className="text-warm-900 dark:text-warm-50">보호소를 만드는 것</strong>입니다.
            갈 곳 없는 유기묘, 유기견 친구들이 더는 길에서 떨지 않아도 되는 곳이요.
          </p>
          <p>
            세계냥주는 그 꿈을 응원하며 만든 작은 서비스입니다. 여러분의
            고양이가 세계 곳곳을 여행하는 동안, 우리가 함께 웃는 동안 —
            어딘가 길 위의 친구들도 한 번쯤 떠올려 주셨으면 해서요.
          </p>
          <p className="font-medium text-warm-900 dark:text-warm-50">
            거창한 걸 바라는 게 아니에요. 지나가다 마주친 길냥이에게 눈인사
            한 번, 물그릇 하나. 그거면 충분합니다. 동물들을 조금만 더
            사랑해 주세요. 🐾
          </p>
        </div>

        {/* CTA */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-warm-900 shadow-sm transition-colors hover:bg-primary-light"
          >
            <CatPawIcon size={16} tone="selected" />
            우리 냥이 세계여행 보내주러 가기
          </Link>
          <a
            href={NOTION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-warm-500 underline-offset-4 transition-colors hover:text-primary hover:underline dark:text-warm-400"
          >
            13냥이들의 일상 구경하기 (노션) →
          </a>
        </div>
      </article>
    </main>
  );
}
