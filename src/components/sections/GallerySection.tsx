'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CatPawIcon } from '@/components/ui/CatPawIcon';

type GalleryItem = { url: string; uploadedAt: string };

// 유저들이 공유한 실제 AI 생성 결과 (shared-results Blob)를 보여주는 갤러리.
export function GallerySection() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);

  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((data: { items?: GalleryItem[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  // 로딩 중이거나 아직 공유된 결과가 없으면 섹션 자체를 숨긴다 —
  // 빈 갤러리를 보여주는 것보다 깔끔하다.
  if (!items || items.length === 0) return null;

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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item, i) => (
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
