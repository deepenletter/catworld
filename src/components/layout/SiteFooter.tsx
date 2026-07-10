'use client';

import { CatPawIcon } from '@/components/ui/CatPawIcon';

// 집사(운영자) 소개 노션 페이지.
const STORY_URL =
  'https://maddening-laugh-c23.notion.site/1e434d04ef1c8080af86e7413b9b2a4f';

// 츄르값(후원) 링크 — 토스 송금 링크가 생기면 여기만 교체하면 된다.
// 지금은 노션 페이지(계좌/후원 안내 포함 예정)로 연결.
const CHURU_URL = STORY_URL;

export function SiteFooter() {
  return (
    <footer className="border-t border-warm-200/60 bg-warm-100/60 px-4 py-10 dark:border-warm-800 dark:bg-warm-900/40 sm:px-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <CatPawIcon size={22} tone="hovered" />
        <p className="text-sm leading-relaxed text-warm-600 dark:text-warm-300">
          이 서비스는 <span className="font-semibold text-warm-800 dark:text-warm-100">구조묘 13마리와 사는 집사</span>가
          만들었어요.
          <br className="hidden sm:block" />
          새벽마다 동네 길냥이들 밥을 챙기며, 그 친구들을 책임지려 오늘도 열심히 운영 중이에요.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={STORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-warm-300 bg-white px-4 py-2 text-sm font-semibold text-warm-700 transition-colors hover:bg-warm-50 dark:border-warm-700 dark:bg-warm-800 dark:text-warm-200 dark:hover:bg-warm-700"
          >
            🐾 13냥 집사 이야기
          </a>
          <a
            href={CHURU_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-warm-900 shadow-sm transition-colors hover:bg-primary-light"
          >
            🐟 개발자에게 츄르값 쏘기
          </a>
        </div>

        <p className="text-xs text-warm-400 dark:text-warm-500">
          보내주신 츄르값은 길냥이들 사료와 서버비에 소중하게 쓰여요.
        </p>
      </div>
    </footer>
  );
}
