'use client';

import { motion } from 'framer-motion';
import { galleryItems } from '@/data/countries';

export function GallerySection() {
  return (
    <section id="gallery" className="py-20 px-4 sm:px-6 bg-white dark:bg-warm-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-warm-900 dark:text-warm-50 mb-3">
            세계냥주 갤러리
          </h2>
          <p className="text-warm-500 dark:text-warm-400">
            다른 고양이들의 세계 여행 사진을 구경해보세요
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {galleryItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl shadow-card transition-shadow duration-300 hover:shadow-card-hover"
            >
              {/* Gradient preview */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.gradient} transition-transform duration-500 group-hover:scale-105`}
              />

              {/* Pattern */}
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                }}
              />

              {/* Cat + emoji */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {item.emoji}
                  </div>
                  <div className="text-5xl opacity-60">🐱</div>
                </div>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-medium text-sm leading-tight">{item.styleTitle}</p>
                <p className="text-white/60 text-xs">{item.countryName}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-warm-400 dark:text-warm-600 text-sm">
            ✨ 실제 AI 생성 결과는 업로드 후 확인하실 수 있습니다
          </p>
        </div>
      </div>
    </section>
  );
}
