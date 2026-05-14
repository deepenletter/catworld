'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppState } from '@/hooks/useAppState';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/sections/HeroSection';
import { GlobeSection } from '@/components/sections/GlobeSection';
import { StyleSection } from '@/components/sections/StyleSection';
import { UploadSection } from '@/components/sections/UploadSection';
import { ResultSection } from '@/components/sections/ResultSection';
import { GallerySection } from '@/components/sections/GallerySection';
import { FAQSection } from '@/components/sections/FAQSection';
import { LoadingState } from '@/components/ui/LoadingState';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: 'easeIn' } },
};

export default function Home() {
  const { state, actions } = useAppState();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.phase]);

  const showStaticSections = state.phase === 'result';

  return (
    <>
      <Header
        phase={state.phase}
        onLogoClick={actions.goHome}
        onGlobeClick={actions.goToGlobe}
      />

      {/* ─── Dynamic experience zone ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Landing */}
        {state.phase === 'landing' && (
          <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <HeroSection onStart={actions.goToGlobe} />
          </motion.div>
        )}

        {/* Globe selection */}
        {state.phase === 'globe' && (
          <motion.div key="globe" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <GlobeSection
              onCountrySelect={actions.selectCountry}
              onBack={actions.goHome}
            />
          </motion.div>
        )}

        {/* Country selected → show style cards */}
        {(state.phase === 'country_selected' || state.phase === 'style_selected') &&
          state.selectedCountry && (
            <motion.div key="country" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <StyleSection
                country={state.selectedCountry}
                selectedStyle={state.selectedStyle}
                onStyleSelect={actions.selectStyle}
                onBack={actions.goToGlobe}
              />

              {/* Upload section slides in when style is selected */}
              <AnimatePresence>
                {state.phase === 'style_selected' && state.selectedStyle && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <UploadSection
                      country={state.selectedCountry}
                      style={state.selectedStyle}
                      uploadedImage={state.uploadedImageUrl}
                      isGenerating={state.isGenerating}
                      error={state.error}
                      onUpload={actions.handleUpload}
                      onClearUpload={actions.clearUpload}
                      onGenerate={actions.generate}
                      onChangeStyle={actions.backToCountry}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        {/* Generating */}
        {state.phase === 'generating' && (
          <motion.div
            key="generating"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="pt-16"
          >
            <LoadingState
              progress={state.generationProgress}
              country={state.selectedCountry}
              style={state.selectedStyle}
            />
          </motion.div>
        )}

        {/* Result */}
        {state.phase === 'result' && (
          <motion.div key="result" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ResultSection
              originalImage={state.uploadedImageUrl}
              resultImage={state.resultImageUrl}
              country={state.selectedCountry}
              style={state.selectedStyle}
              onRetry={actions.retryStyle}
              onNewCountry={actions.goNewCountry}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Static sections (landing & result only) ─────────────────────── */}
      {showStaticSections && (
        <>
          <GallerySection />
          <FAQSection />
        </>
      )}

      {state.phase !== 'globe' && (
        <footer className="bg-warm-900 dark:bg-warm-950 text-warm-400 py-10 px-6 text-center border-t border-warm-800">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xl font-display font-bold text-primary">세계냥주</span>
              <span>🐾</span>
            </div>
            <p className="text-sm mb-2">우리집 고양이, 세계 여행 떠나다</p>
            <p className="text-xs text-warm-600">
              © 2024 세계냥주 · 고양이 얼굴 정체성 보존 AI 기반 이미지 변환 서비스
            </p>
          </div>
        </footer>
      )}
    </>
  );
}
