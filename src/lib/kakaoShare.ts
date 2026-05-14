declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

let sdkPromise: Promise<typeof window.Kakao | null> | null = null;

function injectSdk(): Promise<typeof window.Kakao | null> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    if (window.Kakao) {
      resolve(window.Kakao);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Kakao ?? null), { once: true });
      existing.addEventListener('error', () => reject(new Error('카카오 SDK를 불러오지 못했습니다.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js';
    script.crossOrigin = 'anonymous';
    script.dataset.kakaoSdk = 'true';
    script.onload = () => resolve(window.Kakao ?? null);
    script.onerror = () => reject(new Error('카카오 SDK를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });
}

export async function loadKakaoSdk() {
  const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  if (!key) return null;

  if (!sdkPromise) {
    sdkPromise = injectSdk();
  }

  const kakao = await sdkPromise;
  if (!kakao) return null;

  if (!kakao.isInitialized()) {
    kakao.init(key);
  }

  return kakao;
}

export async function shareToKakao(options: {
  title: string;
  description: string;
  imageUrl: string;
  shareUrl: string;
}) {
  const kakao = await loadKakaoSdk();
  if (!kakao) {
    throw new Error('카카오 공유를 사용하려면 NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 설정이 필요합니다.');
  }

  kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: options.title,
      description: options.description,
      imageUrl: options.imageUrl,
      link: {
        mobileWebUrl: options.shareUrl,
        webUrl: options.shareUrl,
      },
    },
    buttons: [
      {
        title: '결과 보기',
        link: {
          mobileWebUrl: options.shareUrl,
          webUrl: options.shareUrl,
        },
      },
    ],
  });
}
