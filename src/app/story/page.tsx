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
    images: [{ url: 'https://catworld-pi.vercel.app/story/hanchi-sechi.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://catworld-pi.vercel.app/story/hanchi-sechi.jpg'],
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

// 13냥 가족 소개 — 구조 이야기와 함께.
// before(길 위에서) / after(지금은) 둘 다 있으면 비포·애프터로, 하나면 단독 사진으로 렌더.
type FamilyCat = {
  names: string;
  story: string;
  before?: string;
  // 길 위 시절 사진이 두 장인 경우 (3장 나란히 레이아웃).
  before2?: string;
  after?: string;
};

const FAMILY: FamilyCat[] = [
  {
    before: '/story/boknun-family.jpg',
    after: '/story/boknun-family-now.jpg',
    names: '복눈 · 솜눈 · 꽃눈 · 첫눈',
    story:
      '"길에 눈이 아픈 아기 고양이들이 있어요." 그 한 마디에 달려가 만난 사형제. 눈이 짓무른 채 서로에게 기대어 있던 아기들은, 이제 우리 집 대장 라인이 되었어요. (대장은 복눈이에요)',
  },
  {
    before: '/story/aeteut-before.jpg',
    before2: '/story/aeteut-street2.jpg',
    after: '/story/aeteut.jpg',
    names: '애틋',
    story:
      '같은 밥자리 친구 체셔와 함께 온 아이. 체셔는 먼저 별이 되었지만, 애틋이 곁엔 그 몫까지의 사랑이 남아 있어요.',
  },
  {
    before: '/story/hanchi-sechi-before.jpg',
    after: '/story/hanchi-sechi.jpg',
    names: '한치 · 세치',
    story:
      '안양천 다리 아래 살던 형제. 다리가 그물로 막힌다는 소식에 서둘러 데려왔어요. 아픈 발을 고치고도 아직 손은 안 타는 새침이들 — 주둥이에 카레 묻은 쪽이 세치예요.',
  },
  {
    before: '/story/pinko-before.jpg',
    after: '/story/pinko.jpg',
    names: '핑코',
    story:
      '머리를 크게 다친 채 발견된 아이. 수술 자국이 아물 때까지 넥카라를 쓰고 버텼어요. 입양 보내려 했는데 너무 개냥이라 그대로 눌러앉았고, 지금은 사료 모델 경력까지 있는 효자냥이에요.',
  },
  {
    before: '/story/yangsun.jpg',
    after: '/story/yangsun-now.jpg',
    names: '양순',
    story:
      '스무 살 할머니 고양이. 밥자리에서 쫓겨나고 돌을 맞으면서도 버티던 아이를 더는 두고 볼 수 없었어요. 이제 따뜻한 방석 위에서 여생을 보내는 중 — 혀 빼꼼은 여전해요.',
  },
  {
    after: '/story/jyujyu.jpg',
    names: '쥬쥬',
    story:
      '양순 할매 밥자리에 나타난 초개냥이. 할매랑 같이, 둘 다 데려왔어요.',
  },
  {
    before: '/story/aeganjang-before.jpg',
    after: '/story/aeganjang-aebiang.jpg',
    names: '애간장 · 애비앙',
    story:
      '삼형제 중 둘. 애간장은 피눈물 흘리던 눈을 수술로 잃었지만 누구보다 씩씩하고, 애비앙은 집 앞까지 졸졸 따라오던 개냥이예요. 막내는 좋은 집으로 입양 갔어요.',
  },
  {
    after: '/story/nuri.jpg',
    names: '누리',
    story:
      '모르는 사람 무릎에도 앉던 개냥이… 였는데, 집에 오니 새침해졌어요. 그래도 사랑해.',
  },
];

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

        <PawDivider />

        {/* 가족 소개 */}
        <section className="mt-4">
          <h2 className="mb-2 text-center font-display text-2xl font-bold text-warm-900 dark:text-warm-50">
            우리 가족을 소개할게요
          </h2>
          <p className="mb-8 text-center text-sm text-warm-500 dark:text-warm-400">
            열세 마리, 전부 길에서 온 아이들이에요.
          </p>

          <div className="space-y-8">
            {FAMILY.map((cat) => {
              const hasPair = !!cat.before && !!cat.after;
              const single = cat.before ?? cat.after;
              return (
                <figure
                  key={cat.names}
                  className="overflow-hidden rounded-3xl border border-warm-200 bg-white shadow-sm dark:border-warm-800 dark:bg-warm-900"
                >
                  {hasPair ? (
                    <div
                      className={`grid gap-0.5 bg-warm-200 dark:bg-warm-800 ${
                        cat.before2 ? 'grid-cols-3' : 'grid-cols-2'
                      }`}
                    >
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.before}
                          alt={`${cat.names} — 길 위에서`}
                          loading="lazy"
                          className="aspect-square w-full object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          길 위에서
                        </span>
                      </div>
                      {cat.before2 && (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cat.before2}
                            alt={`${cat.names} — 길 위에서 2`}
                            loading="lazy"
                            className="aspect-square w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.after}
                          alt={`${cat.names} — 지금은`}
                          loading="lazy"
                          className="aspect-square w-full object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-warm-900 backdrop-blur-sm">
                          지금은 🏠
                        </span>
                      </div>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={single}
                      alt={cat.names}
                      loading="lazy"
                      className="max-h-[420px] w-full object-cover"
                    />
                  )}
                  <figcaption className="px-5 py-4">
                    <p className="mb-1 font-display text-lg font-bold text-warm-900 dark:text-warm-50">
                      {cat.names}
                    </p>
                    <p className="text-sm leading-relaxed text-warm-600 dark:text-warm-300">
                      {cat.story}
                    </p>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm leading-relaxed text-warm-500 dark:text-warm-400">
            그리고 먼저 별이 된 체셔와, 잠시 머물다 간 하숙냥이들까지 —<br />
            모두 이 집의 소중한 이야기예요.
          </p>
        </section>

        {/* 노션 일기 카드 */}
        <a
          href={NOTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-12 block overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md dark:from-warm-900 dark:to-warm-800 dark:border-primary/30 sm:p-7"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">📔</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-warm-900 dark:text-warm-50">
                13냥이들의 일상 일기
              </p>
              <p className="mt-0.5 text-sm text-warm-600 dark:text-warm-300">
                오늘도 뒹굴거리는 아이들의 사진과 근황, 노션에서 계속 기록 중이에요.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-warm-900 shadow-sm transition-colors group-hover:bg-primary-light">
              구경가기 →
            </span>
          </div>
        </a>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-warm-900 shadow-sm transition-colors hover:bg-primary-light"
          >
            <CatPawIcon size={16} tone="selected" />
            우리 냥이 세계여행 보내주러 가기
          </Link>
        </div>
      </article>
    </main>
  );
}
