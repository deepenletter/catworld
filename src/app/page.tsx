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

      <AnimatePresence mode="wait">
        {state.phase === 'landing' && (
          <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <HeroSection onStart={actions.goToGlobe} />
          </motion.div>
        )}

        {state.phase === 'globe' && (
          <motion.div key="globe" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <GlobeSection
              onCountrySelect={actions.selectCountry}
              onBack={actions.goHome}
            />
          </motion.div>
        )}

        {(state.phase === 'country_selected' || state.phase === 'style_selected') &&
          state.selectedCountry && (
            <motion.div key="country" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <StyleSection
                country={state.selectedCountry}
                selectedStyle={state.selectedStyle}
                onStyleSelect={actions.selectStyle}
                onBack={actions.goToGlobe}
              />

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
                      dailyQuota={state.dailyQuota}
                      dailyQuotaApplies={state.dailyQuotaApplies}
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

      {showStaticSections && (
        <>
          <GallerySection />
          <FAQSection />
        </>
      )}
    </>
  );
}
