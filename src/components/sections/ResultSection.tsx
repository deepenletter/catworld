'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Globe, RotateCcw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { shareToKakao } from '@/lib/kakaoShare';
import {
  buildShareText,
  buildShareTitle,
  buildSocialShareUrl,
  dataUrlToFile,
  openPopup,
  type ShareAsset,
} from '@/lib/share';
import type { Country, StyleCard } from '@/types';

type Props = {
  originalImage: string | null;
  resultImage: string | null;
  country: Country | null;
  style: StyleCard | null;
  onRetry: () => void;
  onNewCountry: () => void;
};

type ShareActionProps = {
  label: string;
  description: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  accent?: 'default' | 'kakao';
};

function ShareActionButton({
  label,
  description,
  onClick,
  disabled,
  accent = 'default',
}: ShareActionProps) {
  return (
    <button
      onClick={() => void onClick()}
      disabled={disabled}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
        accent === 'kakao'
          ? 'border-[#FEE500] bg-[#FFF7A3] text-[#381e1f] hover:bg-[#ffef61]'
          : 'border-warm-200 bg-white text-warm-800 hover:border-primary/40 hover:bg-primary/5'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="font-semibold">{label}</div>
      <div className="mt-1 text-xs text-warm-500">{description}</div>
    </button>
  );
}

export function ResultSection({
  originalImage,
  resultImage,
  country,
  style,
  onRetry,
  onNewCountry,
}: Props) {
  const [comparing, setComparing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareAsset, setShareAsset] = useState<ShareAsset | null>(null);

  const shareTitle = buildShareTitle(country, style);
  const shareText = buildShareText(country, style);
  const kakaoEnabled = Boolean(process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY);
  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `catworld_${country?.name ?? 'result'}_${style?.title ?? 'share'}.jpg`;
    a.click();
  };

  const prepareShareAsset = async (): Promise<ShareAsset | null> => {
    if (shareAsset) return shareAsset;
    if (!resultImage) return null;

    setShareLoading(true);
    setShareError(null);

    try {
      const response = await fetch('/api/share/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl: resultImage,
          title: shareTitle,
          description: shareText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? '공유용 이미지를 준비하지 못했습니다.');
      }

      const asset: ShareAsset = {
        imageUrl: data.imageUrl,
        shareUrl: data.shareUrl,
      };
      setShareAsset(asset);
      return asset;
    } catch (error) {
      const message = error instanceof Error ? error.message : '공유용 이미지를 준비하지 못했습니다.';
      setShareError(message);
      return null;
    } finally {
      setShareLoading(false);
    }
  };

  const handleOpenShare = async () => {
    setShareOpen(true);
    if (!shareAsset && resultImage) {
      await prepareShareAsset();
    }
  };

  const handleSystemShare = async () => {
    if (!hasNativeShare) return;

    try {
      const file = resultImage
        ? dataUrlToFile(resultImage, `catworld-share-${Date.now()}.png`)
        : null;

      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
        return;
      }

      const asset = shareAsset ?? await prepareShareAsset();
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: asset?.shareUrl,
      });
    } catch {
      // user cancelled
    }
  };

  const handleCopyLink = async () => {
    const asset = shareAsset ?? await prepareShareAsset();
    if (!asset) return;

    await navigator.clipboard.writeText(asset.shareUrl);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  const handleSocialShare = async (
    platform: 'x' | 'facebook' | 'telegram' | 'whatsapp' | 'email',
  ) => {
    const asset = shareAsset ?? await prepareShareAsset();
    if (!asset) return;

    openPopup(buildSocialShareUrl(platform, asset.shareUrl, shareText));
  };

  const handleKakaoShare = async () => {
    const asset = shareAsset ?? await prepareShareAsset();
    if (!asset) return;

    await shareToKakao({
      title: shareTitle,
      description: shareText,
      imageUrl: asset.imageUrl,
      shareUrl: asset.shareUrl,
    });
  };

  return (
    <section className="min-h-screen bg-warm-50 dark:bg-warm-950 pt-20 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-green-200 dark:border-green-800">
            변신 완료
          </div>
          <h2 className="text-3xl font-display font-bold text-warm-900 dark:text-warm-50 mb-2">
            여행 사진이 도착했어요
          </h2>
          {country && style && (
            <p className="text-warm-500 dark:text-warm-400 text-sm">
              {country.emoji} {country.name} · {style.emoji} {style.title}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden shadow-card-hover mb-6"
        >
          {resultImage && (
            <img
              src={resultImage}
              alt="생성된 결과 이미지"
              className="w-full object-cover"
              style={{ filter: `hue-rotate(${style ? getHueShift(style.id) : 0}deg) saturate(1.2) brightness(1.05)` }}
            />
          )}

          {country && style && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm border border-white/10">
              <span>{country.emoji}</span>
              <span className="font-medium">{style.title}</span>
            </div>
          )}

          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white/60 text-[10px] px-2 py-0.5 rounded-full border border-white/10">
            demo preview
          </div>
        </motion.div>

        {originalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <button
              onClick={() => setComparing((v) => !v)}
              className="w-full text-sm text-warm-500 hover:text-primary dark:text-warm-400 transition-colors py-2 border border-warm-200 dark:border-warm-800 rounded-xl hover:border-primary/40 bg-white dark:bg-warm-900"
            >
              {comparing ? '비교 닫기' : '원본과 비교하기'}
            </button>

            <AnimatePresence>
              {comparing && (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden mt-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative rounded-2xl overflow-hidden">
                      <img src={originalImage} alt="원본" className="w-full aspect-square object-cover" />
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                        원본
                      </div>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={resultImage ?? ''}
                        alt="결과"
                        className="w-full aspect-square object-cover"
                        style={{ filter: `hue-rotate(${style ? getHueShift(style.id) : 0}deg) saturate(1.2) brightness(1.05)` }}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                        결과
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" onClick={handleDownload} icon={<Download className="w-4 h-4" />} className="w-full">
              저장하기
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleOpenShare}
              icon={<Share2 className="w-4 h-4" />}
              className="w-full"
            >
              {shareSuccess ? '링크 복사됨' : '공유하기'}
            </Button>
          </div>

          <Button
            size="lg"
            variant="outline"
            onClick={onRetry}
            icon={<RotateCcw className="w-4 h-4" />}
            className="w-full"
          >
            같은 나라 다른 스타일
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onClick={onNewCountry}
            icon={<Globe className="w-4 h-4" />}
            className="w-full"
          >
            다른 나라 선택하기
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {shareOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareOpen(false)}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl rounded-t-[28px] border border-warm-200 bg-[#fffaf0] px-4 pb-6 pt-5 shadow-[0_-24px_80px_rgba(0,0,0,0.24)]"
            >
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-warm-200" />
              <div className="mb-4">
                <h3 className="text-lg font-bold text-warm-900">공유하기</h3>
                <p className="mt-1 text-sm text-warm-500">
                  모바일에서는 시스템 공유 시트로 카카오톡과 SNS를 바로 열 수 있어요.
                </p>
              </div>

              {shareLoading && (
                <div className="mb-4 rounded-2xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-600">
                  공유용 링크와 이미지를 준비하는 중입니다.
                </div>
              )}

              {shareError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {shareError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {hasNativeShare && (
                  <ShareActionButton
                    label="카카오톡/SNS 공유 시트 열기"
                    description="휴대폰에서 카카오톡 방, 인스타그램, 메시지 등 설치된 앱 공유 대상이 뜹니다."
                    onClick={handleSystemShare}
                  />
                )}

                {kakaoEnabled && (
                  <ShareActionButton
                    label="카카오톡으로 보내기"
                    description="카카오 JavaScript 키가 설정된 경우 카카오톡 공유 창을 엽니다."
                    onClick={handleKakaoShare}
                    disabled={shareLoading}
                    accent="kakao"
                  />
                )}

                <ShareActionButton
                  label="링크 복사"
                  description="공유 페이지 링크를 복사합니다."
                  onClick={handleCopyLink}
                  disabled={shareLoading}
                />

                <ShareActionButton
                  label="X 공유"
                  description="X 공유 페이지를 엽니다."
                  onClick={() => handleSocialShare('x')}
                  disabled={shareLoading}
                />

                <ShareActionButton
                  label="Facebook 공유"
                  description="Facebook 공유 페이지를 엽니다."
                  onClick={() => handleSocialShare('facebook')}
                  disabled={shareLoading}
                />

                <ShareActionButton
                  label="Telegram 공유"
                  description="Telegram 공유 페이지를 엽니다."
                  onClick={() => handleSocialShare('telegram')}
                  disabled={shareLoading}
                />

                <ShareActionButton
                  label="WhatsApp 공유"
                  description="WhatsApp 공유 페이지를 엽니다."
                  onClick={() => handleSocialShare('whatsapp')}
                  disabled={shareLoading}
                />

                <ShareActionButton
                  label="이메일 공유"
                  description="메일 앱으로 결과 링크를 보냅니다."
                  onClick={() => handleSocialShare('email')}
                  disabled={shareLoading}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-warm-200 bg-white px-4 py-3 text-xs text-warm-500">
                시스템 공유를 지원하지 않는 브라우저에서는 이 팝업 안의 버튼으로 공유할 수 있습니다.
              </div>

              <button
                onClick={() => setShareOpen(false)}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-warm-200 bg-white px-4 py-2 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50"
              >
                닫기
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

function getHueShift(styleId: string): number {
  const map: Record<string, number> = {
    jp_01: -10, jp_02: 30, jp_03: 15, jp_04: -20,
    fr_01: 10, fr_02: -15, fr_03: 5, fr_04: 20,
    eg_01: 25, eg_02: 20, eg_03: 0, eg_04: 30,
    it_01: -5, it_02: -30, it_03: 15, it_04: 10,
    mx_01: 20, mx_02: 10, mx_03: 25, mx_04: 15,
    th_01: 22, th_02: -25, th_03: 35, th_04: 10,
  };
  return map[styleId] ?? 0;
}
