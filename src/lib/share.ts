import type { Country, StyleCard } from '@/types';

export type ShareAsset = {
  imageUrl: string;
  shareUrl: string;
};

export function buildShareTitle(country: Country | null, style: StyleCard | null): string {
  if (!country || !style) return '세계냥주';
  return `세계냥주 - ${country.name} ${style.title}`;
}

export function buildShareText(country: Country | null, style: StyleCard | null): string {
  return `우리 집 고양이가 ${country?.emoji ?? ''} ${country?.name ?? ''} 감성으로 변신했어요. ${style?.title ?? ''} 결과를 확인해 보세요.`;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('공유할 이미지 데이터를 읽지 못했습니다.');
  }

  const mimeType = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

export function openPopup(url: string) {
  if (typeof window === 'undefined') return;

  window.open(url, '_blank', 'noopener,noreferrer,width=640,height=720');
}

export function buildSocialShareUrl(
  platform: 'x' | 'facebook' | 'telegram' | 'whatsapp' | 'email',
  shareUrl: string,
  shareText: string,
): string {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case 'whatsapp':
      return `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
    case 'email':
      return `mailto:?subject=${encodeURIComponent('세계냥주 결과 공유')}&body=${encodedText}%0A%0A${encodedUrl}`;
    default:
      return shareUrl;
  }
}
