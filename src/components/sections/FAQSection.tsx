'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: '어떤 사진이 가장 잘 나오나요?',
    a: '고양이 얼굴이 정면을 향하고, 털 색깔과 눈 색이 잘 보이는 밝고 선명한 사진이 가장 좋습니다. 배경이 단순하고 얼굴이 화면 중앙에 위치할수록 정체성 보존이 잘 됩니다.',
  },
  {
    q: '결과 이미지에서 내 고양이를 알아볼 수 있나요?',
    a: '네, 세계냥주는 얼굴 정체성 보존 기술을 사용합니다. 털 색, 눈 색, 얼굴형, 코 모양 등 고양이 고유의 특징은 최대한 유지하면서 스타일 요소(배경, 의상, 소품, 조명)만 바뀝니다.',
  },
  {
    q: '생성까지 얼마나 걸리나요?',
    a: '보통 10~30초 정도 소요됩니다. 서버 상황에 따라 최대 1분이 걸릴 수 있습니다.',
  },
  {
    q: '어떤 나라와 스타일을 지원하나요?',
    a: '현재 일본, 프랑스, 이집트, 이탈리아, 멕시코, 태국 6개국을 지원하며, 각 나라당 4가지 스타일을 제공합니다. 앞으로 더 많은 나라와 스타일이 추가될 예정입니다.',
  },
  {
    q: '내 고양이 사진은 어떻게 처리되나요?',
    a: '업로드된 사진은 이미지 생성에만 사용되며, 생성 완료 후 서버에서 삭제됩니다. 사용자 동의 없이 갤러리에 공개되거나 다른 목적으로 사용되지 않습니다.',
  },
  {
    q: '모바일에서도 사용할 수 있나요?',
    a: '네! 세계냥주는 완전한 모바일 반응형으로 제작되었습니다. 3D 지구본은 데스크톱에서, 모바일에서는 최적화된 나라 선택 화면을 제공합니다.',
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 bg-warm-50 dark:bg-warm-950">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-warm-900 dark:text-warm-50 mb-3">
            자주 묻는 질문
          </h2>
          <p className="text-warm-500 dark:text-warm-400">
            세계냥주 이용에 관한 궁금증을 해결해 드립니다
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
              >
                <span className="font-medium text-warm-900 dark:text-warm-100 text-sm sm:text-base">
                  {item.q}
                </span>
                <span className="shrink-0 w-6 h-6 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center text-warm-500 dark:text-warm-400">
                  {openIdx === i ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-warm-600 dark:text-warm-400 text-sm leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
