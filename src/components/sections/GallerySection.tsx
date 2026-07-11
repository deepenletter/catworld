'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CatPawIcon } from '@/components/ui/CatPawIcon';

type GalleryItem = { url: string; uploadedAt: string };

// 유저들이 공유한 실제 AI 생성 결과 (shared-results Blob)를 보여주는 갤러리.
// 섹션은 항상 렌더된다 — 로딩/빈/실패 상태를 그대로 보여줘야 #gallery 앵커가
// 언제나 동작하고, 문제가 생겨도 "조용히 사라지는" 미스터리가 없다.
export function GallerySection() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/gallery', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { items?: GalleryItem[] }) => setItems(data.items ?? []))
      .catch(() => {
        setFailed(true);
        setItems([]);
      });
  }, []);

  return (
    <section id="gallery" className="py-20 px-4 sm:px-6 bg-white dark:bg-warm-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-warm-900 dark:text-warm-50 mb-3">
            세계냥주 갤러리
          </h2>
          <p className="text-warm-500 dark:text-warm-400">
            집사들이 공유한 진짜 여행 사진들이에요
          </p>
        </div>

        {/* 로딩 스켈레톤 */}
        {items === null && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-warm-100 dark:bg-warm-800"
              />
            ))}
          </div>
        )}

        {/* 빈/실패 상태 */}
        {items !== null && items.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-warm-200 py-16 text-center dark:border-warm-700">
            <div className="mb-3 text-4xl">📸</div>
            <p className="font-medium text-warm-600 dark:text-warm-300">
              {failed
                ? '갤러리를 불러오지 못했어요. 잠시 후 새로고침해 주세요.'
                : '아직 공유된 여행 사진이 없어요.'}
            </p>
            {!failed && (
              <p className="mt-1 text-sm text-warm-400 dark:text-warm-500">
                첫 번째로 우리 냥이의 여행 사진을 전시해 보세요!
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {(items ?? []).map((item, i) => (
            <motion.div
              key={item.url}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (i % 4) * 0.06, duration: 0.5 }}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-warm-100 shadow-card transition-shadow duration-300 hover:shadow-card-hover dark:bg-warm-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt="집사가 공유한 세계냥주 여행 사진"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-warm-400 dark:text-warm-600">
          <CatPawIcon size={14} tone="ambient" />
          <span>결과 화면에서 공유하면 여기에 전시돼요</span>
        </div>
      </div>
    </section>
  );
}
