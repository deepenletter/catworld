'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AdminCountryConfig,
  AdminTemplate,
  FaceBox,
  TemplateGenerationMode,
} from '@/types';
import {
  extractCustomCountries,
  extractEnabledCountrySlugs,
  getTemplateGenerationMode,
  normalizeAdminConfig,
  type CustomCountryData,
} from '@/lib/adminConfig';
import {
  TEMPLATE_RATIO_LABEL,
  TEMPLATE_RECOMMENDED_MIN_HEIGHT,
  TEMPLATE_RECOMMENDED_MIN_WIDTH,
  buildTemplateAspectRatioError,
  isTemplateAspectRatioValid,
} from '@/lib/templateImage';

const COUNTRY_PRESETS: { name: string; nameEn: string; code: string; lat: number; lng: number }[] = [
  { name: '한국', nameEn: 'Korea', code: 'kr', lat: 37.5, lng: 127.0 },
  { name: '미국', nameEn: 'United States', code: 'us', lat: 38.9, lng: -77.0 },
  { name: '영국', nameEn: 'United Kingdom', code: 'gb', lat: 51.5, lng: -0.1 },
  { name: '독일', nameEn: 'Germany', code: 'de', lat: 51.2, lng: 10.5 },
  { name: '스페인', nameEn: 'Spain', code: 'es', lat: 40.4, lng: -3.7 },
  { name: '그리스', nameEn: 'Greece', code: 'gr', lat: 39.1, lng: 21.8 },
  { name: '터키', nameEn: 'Turkey', code: 'tr', lat: 39.9, lng: 32.9 },
  { name: '인도', nameEn: 'India', code: 'in', lat: 20.6, lng: 79.0 },
  { name: '호주', nameEn: 'Australia', code: 'au', lat: -25.3, lng: 133.8 },
  { name: '캐나다', nameEn: 'Canada', code: 'ca', lat: 56.1, lng: -106.3 },
  { name: '브라질', nameEn: 'Brazil', code: 'br', lat: -14.2, lng: -51.9 },
  { name: '아르헨티나', nameEn: 'Argentina', code: 'ar', lat: -38.4, lng: -63.6 },
  { name: '러시아', nameEn: 'Russia', code: 'ru', lat: 55.8, lng: 37.6 },
  { name: '베트남', nameEn: 'Vietnam', code: 'vn', lat: 14.1, lng: 108.3 },
  { name: '인도네시아', nameEn: 'Indonesia', code: 'id', lat: -0.8, lng: 113.9 },
  { name: '싱가포르', nameEn: 'Singapore', code: 'sg', lat: 1.3, lng: 103.8 },
  { name: '말레이시아', nameEn: 'Malaysia', code: 'my', lat: 4.2, lng: 108.0 },
  { name: '필리핀', nameEn: 'Philippines', code: 'ph', lat: 12.9, lng: 121.8 },
  { name: '포르투갈', nameEn: 'Portugal', code: 'pt', lat: 38.7, lng: -9.1 },
  { name: '네덜란드', nameEn: 'Netherlands', code: 'nl', lat: 52.1, lng: 5.3 },
  { name: '스위스', nameEn: 'Switzerland', code: 'ch', lat: 46.8, lng: 8.2 },
  { name: '오스트리아', nameEn: 'Austria', code: 'at', lat: 47.8, lng: 13.0 },
  { name: '스웨덴', nameEn: 'Sweden', code: 'se', lat: 59.3, lng: 18.1 },
  { name: '노르웨이', nameEn: 'Norway', code: 'no', lat: 59.9, lng: 10.7 },
  { name: '덴마크', nameEn: 'Denmark', code: 'dk', lat: 55.7, lng: 12.6 },
  { name: '핀란드', nameEn: 'Finland', code: 'fi', lat: 60.2, lng: 24.9 },
  { name: '체코', nameEn: 'Czech Republic', code: 'cz', lat: 50.1, lng: 14.4 },
  { name: '헝가리', nameEn: 'Hungary', code: 'hu', lat: 47.5, lng: 19.0 },
  { name: '폴란드', nameEn: 'Poland', code: 'pl', lat: 52.2, lng: 21.0 },
  { name: '모로코', nameEn: 'Morocco', code: 'ma', lat: 33.9, lng: -6.9 },
  { name: '남아프리카', nameEn: 'South Africa', code: 'za', lat: -25.7, lng: 28.2 },
  { name: '케냐', nameEn: 'Kenya', code: 'ke', lat: -1.3, lng: 36.8 },
  { name: '나이지리아', nameEn: 'Nigeria', code: 'ng', lat: 9.1, lng: 7.4 },
  { name: '페루', nameEn: 'Peru', code: 'pe', lat: -9.2, lng: -75.0 },
  { name: '콜롬비아', nameEn: 'Colombia', code: 'co', lat: 4.7, lng: -74.1 },
  { name: '뉴질랜드', nameEn: 'New Zealand', code: 'nz', lat: -41.3, lng: 174.8 },
  { name: '이란', nameEn: 'Iran', code: 'ir', lat: 35.7, lng: 51.4 },
  { name: '이스라엘', nameEn: 'Israel', code: 'il', lat: 31.8, lng: 35.2 },
  { name: '사우디아라비아', nameEn: 'Saudi Arabia', code: 'sa', lat: 24.7, lng: 46.7 },
  { name: '아랍에미리트', nameEn: 'UAE', code: 'ae', lat: 24.5, lng: 54.4 },
  { name: '칠레', nameEn: 'Chile', code: 'cl', lat: -33.5, lng: -70.6 },
  { name: '대만', nameEn: 'Taiwan', code: 'tw', lat: 25.0, lng: 121.5 },
  { name: '홍콩', nameEn: 'Hong Kong', code: 'hk', lat: 22.3, lng: 114.2 },
  { name: '파키스탄', nameEn: 'Pakistan', code: 'pk', lat: 33.7, lng: 73.1 },
  { name: '방글라데시', nameEn: 'Bangladesh', code: 'bd', lat: 23.7, lng: 90.4 },
  { name: '스리랑카', nameEn: 'Sri Lanka', code: 'lk', lat: 7.9, lng: 80.8 },
  { name: '캄보디아', nameEn: 'Cambodia', code: 'kh', lat: 11.6, lng: 104.9 },
  { name: '미얀마', nameEn: 'Myanmar', code: 'mm', lat: 19.7, lng: 96.1 },
  { name: '우크라이나', nameEn: 'Ukraine', code: 'ua', lat: 50.4, lng: 30.5 },
  { name: '루마니아', nameEn: 'Romania', code: 'ro', lat: 44.4, lng: 26.1 },
  { name: '벨기에', nameEn: 'Belgium', code: 'be', lat: 50.8, lng: 4.4 },
  { name: '아이슬란드', nameEn: 'Iceland', code: 'is', lat: 64.1, lng: -21.9 },
  { name: '쿠바', nameEn: 'Cuba', code: 'cu', lat: 23.1, lng: -82.4 },
  { name: '에티오피아', nameEn: 'Ethiopia', code: 'et', lat: 9.0, lng: 38.7 },
];

const COUNTRIES: { slug: string; name: string; code: string }[] = [
  { slug: 'japan', name: '일본', code: 'jp' },
  { slug: 'france', name: '프랑스', code: 'fr' },
  { slug: 'egypt', name: '이집트', code: 'eg' },
  { slug: 'italy', name: '이탈리아', code: 'it' },
  { slug: 'mexico', name: '멕시코', code: 'mx' },
  { slug: 'thailand', name: '태국', code: 'th' },
  { slug: 'china', name: '중국', code: 'cn' },
];

type DrawState = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isDragging: boolean;
};

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read the template image size.'));
    };

    image.src = objectUrl;
  });
}

type FaceBoxEditorProps = {
  templateUrl: string;
  initialFaceBox: FaceBox | null;
  onSave: (box: FaceBox) => void;
  onClose: () => void;
};

function FaceBoxEditor({
  templateUrl,
  initialFaceBox,
  onSave,
  onClose,
}: FaceBoxEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [draw, setDraw] = useState<DrawState>(() => {
    if (initialFaceBox) {
      return {
        startX: initialFaceBox.xRatio,
        startY: initialFaceBox.yRatio,
        endX: initialFaceBox.xRatio + initialFaceBox.wRatio,
        endY: initialFaceBox.yRatio + initialFaceBox.hRatio,
        isDragging: false,
      };
    }

    return { startX: 0, startY: 0, endX: 0, endY: 0, isDragging: false };
  });
  const [imgLoaded, setImgLoaded] = useState(false);

  const getRelativePos = useCallback((event: React.MouseEvent | MouseEvent) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };

    const rect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    return { x, y };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const { x, y } = getRelativePos(event);
    setDraw({ startX: x, startY: y, endX: x, endY: y, isDragging: true });
  }, [getRelativePos]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setDraw((prev) => {
        if (!prev.isDragging) return prev;
        const { x, y } = getRelativePos(event);
        return { ...prev, endX: x, endY: y };
      });
    };

    const handleMouseUp = () => {
      setDraw((prev) => ({ ...prev, isDragging: false }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [getRelativePos]);

  const hasBox = draw.startX !== draw.endX && draw.startY !== draw.endY;
  const boxStyle = {
    left: `${Math.min(draw.startX, draw.endX) * 100}%`,
    top: `${Math.min(draw.startY, draw.endY) * 100}%`,
    width: `${Math.abs(draw.endX - draw.startX) * 100}%`,
    height: `${Math.abs(draw.endY - draw.startY) * 100}%`,
  };

  const handleSave = () => {
    if (!hasBox) return;

    onSave({
      xRatio: Math.min(draw.startX, draw.endX),
      yRatio: Math.min(draw.startY, draw.endY),
      wRatio: Math.abs(draw.endX - draw.startX),
      hRatio: Math.abs(draw.endY - draw.startY),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">고양이 기준 영역 설정</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              이제 그린 프레임이 실제 편집 영역과 거의 같게 적용됩니다. 바꾸고 싶은 고양이 부분만 그대로 감싸고, 배경이나 소품은 포함하지 않게 잡아 주세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4">
          <div
            className="relative overflow-hidden rounded-xl border-2 border-dashed border-blue-300 bg-gray-50"
            style={{ maxHeight: '60vh' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={templateUrl}
              alt="template"
              className="block h-auto w-full cursor-crosshair"
              style={{ maxHeight: '60vh', objectFit: 'contain' }}
              onLoad={() => setImgLoaded(true)}
              onMouseDown={handleMouseDown}
              draggable={false}
            />

            {imgLoaded && hasBox && (
              <div
                className="pointer-events-none absolute border-2 border-blue-500 bg-blue-400/25"
                style={boxStyle}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded bg-white/80 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    실제 편집 영역
                  </span>
                </div>
              </div>
            )}

            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!hasBox}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

type TemplateCardProps = {
  template: AdminTemplate;
  onTitleChange: (value: string) => void;
  onBrightnessChange: (value: number) => void;
  onGenerationModeChange: (mode: TemplateGenerationMode) => void;
  onPromptChange: (value: string) => void;
  onSetFaceBox: () => void;
  onDelete: () => void;
};

function TemplateCard({
  template,
  onTitleChange,
  onBrightnessChange,
  onGenerationModeChange,
  onPromptChange,
  onSetFaceBox,
  onDelete,
}: TemplateCardProps) {
  const mode = getTemplateGenerationMode(template);
  const isComposite = mode === 'composite';
  const isReady = !!template.faceBox;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={template.url}
          alt={template.title}
          className="h-full w-full object-cover"
          style={{ filter: `brightness(${template.brightness}%)` }}
        />

        {template.faceBox && (
          <div
            className="absolute rounded border-2 border-green-400 bg-green-300/20"
            style={{
              left: `${template.faceBox.xRatio * 100}%`,
              top: `${template.faceBox.yRatio * 100}%`,
              width: `${template.faceBox.wRatio * 100}%`,
              height: `${template.faceBox.hRatio * 100}%`,
            }}
          />
        )}

        <div className="absolute left-2 top-2 flex gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isComposite ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
            }`}
          >
            {isComposite ? '얼굴 합성' : 'AI 편집'}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isReady ? 'bg-green-500 text-white' : 'bg-amber-300 text-amber-900'
            }`}
          >
            {isReady ? '준비 완료' : '추가 설정 필요'}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">템플릿 이름</label>
          <input
            type="text"
            value={template.title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="템플릿 이름"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-gray-500">생성 방식</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onGenerationModeChange('composite')}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                isComposite
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              얼굴 합성
            </button>
            <button
              onClick={() => onGenerationModeChange('ai')}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                !isComposite
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              AI 편집
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {isComposite
              ? '빠른 테스트용 간이 합성입니다. 털색과 무늬까지 자연스럽게 맞추려면 AI 편집 모드를 사용하세요.'
              : '현재 목표에 가장 잘 맞는 방식입니다. 템플릿 포즈는 유지하면서 사용자 고양이의 얼굴, 귀, 털색, 무늬를 반영합니다.'}
          </p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500">밝기</label>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-700">
              {template.brightness}%
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            value={template.brightness}
            onChange={(event) => onBrightnessChange(Number(event.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500">추가 디테일</label>
            <span className="text-[11px] text-gray-400">고정 규칙 뒤에 보조로 추가</span>
          </div>
          <textarea
            value={template.prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            disabled={isComposite}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm leading-relaxed focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            placeholder="예: 털 결을 더 선명하게, 눈동자 색과 코 색을 최대한 정확하게 유지"
          />
          <p className="mt-2 text-xs text-gray-500">
            {isComposite
              ? '얼굴 합성 모드에서는 사용되지 않습니다. AI 편집 모드에서만 시스템 고정 규칙 뒤에 추가됩니다.'
              : '시스템이 템플릿 고정 규칙을 먼저 적용하고, 여기에 적은 디테일을 그 다음 우선순위로 함께 사용합니다.'}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">템플릿 URL</label>
          <p className="truncate rounded border border-gray-100 bg-gray-50 px-2 py-1 text-xs text-gray-400">
            {template.url}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSetFaceBox}
            className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            기준 영역 설정
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [loginInput, setLoginInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [config, setConfig] = useState<AdminCountryConfig>({});
  const [enabledSlugs, setEnabledSlugs] = useState<Set<string>>(
    new Set(COUNTRIES.map((c) => c.slug)),
  );
  const [customCountries, setCustomCountries] = useState<CustomCountryData[]>([]);
  const [newForm, setNewForm] = useState({ name: '', nameEn: '', code: '', lat: '', lng: '' });
  const [activeCountry, setActiveCountry] = useState<string>(COUNTRIES[0].slug);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [editingFaceBox, setEditingFaceBox] = useState<{
    templateId: string;
    countrySlug: string;
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [configLoading, setConfigLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const response = await fetch('/api/admin/config');
      if (!response.ok) return;
      const data = await response.json();
      const rawSlugs = extractEnabledCountrySlugs(data);
      const rawCustom = extractCustomCountries(data);
      setCustomCountries(rawCustom);
      if (rawSlugs) {
        setEnabledSlugs(new Set(rawSlugs));
      } else {
        const allSlugs = [
          ...COUNTRIES.map((c) => c.slug),
          ...rawCustom.map((c) => c.slug),
        ];
        setEnabledSlugs(new Set(allSlugs));
      }
      setConfig(normalizeAdminConfig(data));
    } catch {
      // ignore
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginInput }),
      });
      const data = await response.json();

      if (!data.ok) {
        setLoginError('비밀번호가 올바르지 않습니다.');
        return;
      }

      setPassword(loginInput);
      setIsLoggedIn(true);
      await loadConfig();
    } catch {
      setLoginError('서버 연결에 실패했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadingFor) return;

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { width, height } = await readImageDimensions(file);
      if (!isTemplateAspectRatioValid(width, height)) {
        throw new Error(buildTemplateAspectRatioError(width, height));
      }

      const form = new FormData();
      form.append('file', file);
      form.append('countrySlug', uploadingFor);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-pw': password },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Upload failed');

      if (data.warning) {
        alert(data.warning);
      }

      const newTemplate: AdminTemplate = {
        id: `${uploadingFor}_${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, ''),
        url: data.url,
        brightness: 100,
        faceBox: null,
        prompt: '',
        generationMode: 'ai',
      };

      setConfig((prev) => ({
        ...prev,
        [uploadingFor]: [...(prev[uploadingFor] ?? []), newTemplate],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`업로드 실패: ${message}`);
    } finally {
      setUploadingFor(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (countrySlug: string) => {
    setUploadingFor(countrySlug);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const updateTemplate = (
    countrySlug: string,
    templateId: string,
    patch: Partial<AdminTemplate>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [countrySlug]: (prev[countrySlug] ?? []).map((template) =>
        template.id === templateId ? { ...template, ...patch } : template,
      ),
    }));
  };

  const deleteTemplate = (countrySlug: string, templateId: string) => {
    if (!confirm('이 템플릿을 삭제할까요?')) return;

    setConfig((prev) => ({
      ...prev,
      [countrySlug]: (prev[countrySlug] ?? []).filter((template) => template.id !== templateId),
    }));
  };

  const handleFaceBoxSave = (box: FaceBox) => {
    if (!editingFaceBox) return;
    updateTemplate(editingFaceBox.countrySlug, editingFaceBox.templateId, { faceBox: box });
    setEditingFaceBox(null);
  };

  const saveConfig = async () => {
    setSaveStatus('saving');
    try {
      const payload = {
        _meta: {
          enabledCountrySlugs: Array.from(enabledSlugs),
          customCountries,
        },
        ...config,
      };
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pw': password,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Save failed');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      setSaveStatus('error');
      alert(`저장 실패: ${message}`);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const editingTemplate = editingFaceBox
    ? (config[editingFaceBox.countrySlug] ?? []).find(
        (template) => template.id === editingFaceBox.templateId,
      ) ?? null
    : null;

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mb-3 text-4xl">🐱</div>
            <h1 className="text-2xl font-bold text-white">Catworld 관리자</h1>
            <p className="mt-1 text-sm text-slate-400">관리자 비밀번호를 입력해 주세요.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={loginInput}
              onChange={(event) => setLoginInput(event.target.value)}
              placeholder="비밀번호"
              className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />

            {loginError && (
              <p className="text-center text-sm text-red-400">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loginLoading || !loginInput}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginLoading ? '확인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeTemplates = config[activeCountry] ?? [];
  const allAdminCountries = [
    ...COUNTRIES,
    ...customCountries.map((c) => ({ slug: c.slug, name: c.name, code: c.code })),
  ];
  const activeCountryInfo = allAdminCountries.find((country) => country.slug === activeCountry) ?? COUNTRIES[0];;
  const compositeCount = activeTemplates.filter(
    (template) => getTemplateGenerationMode(template) === 'composite',
  ).length;
  const aiCount = activeTemplates.length - compositeCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {editingFaceBox && editingTemplate && (
        <FaceBoxEditor
          templateUrl={editingTemplate.url}
          initialFaceBox={editingTemplate.faceBox}
          onSave={handleFaceBoxSave}
          onClose={() => setEditingFaceBox(null)}
        />
      )}

      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐱</span>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Catworld 관리자</h1>
              <p className="text-xs text-gray-400">템플릿 업로드와 생성 방식 관리</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadConfig}
              disabled={configLoading}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              {configLoading ? '불러오는 중...' : '새로고침'}
            </button>
            <button
              onClick={saveConfig}
              disabled={saveStatus === 'saving'}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors ${
                saveStatus === 'saved'
                  ? 'bg-green-600'
                  : saveStatus === 'error'
                    ? 'bg-red-600'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saveStatus === 'saving'
                ? '저장 중...'
                : saveStatus === 'saved'
                  ? '저장 완료'
                  : saveStatus === 'error'
                    ? '저장 실패'
                    : '설정 저장'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* 나라 표시 설정 */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-gray-800">지구본 나라 표시 설정</h2>
          <p className="mb-4 text-xs text-gray-500">
            체크 해제된 나라는 지구본과 목록에서 숨겨집니다. 저장 후 즉시 반영됩니다.
          </p>
          <div className="flex flex-wrap gap-3">
            {[...COUNTRIES, ...customCountries.map((c) => ({ slug: c.slug, name: c.name, code: c.code }))].map((country) => {
              const enabled = enabledSlugs.has(country.slug);
              return (
                <button
                  key={country.slug}
                  onClick={() => {
                    setEnabledSlugs((prev) => {
                      const next = new Set(prev);
                      if (next.has(country.slug)) {
                        next.delete(country.slug);
                      } else {
                        next.add(country.slug);
                      }
                      return next;
                    });
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                    enabled
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 bg-gray-100 text-gray-400 line-through'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${country.code}.png`}
                    alt=""
                    className={`h-4 w-auto rounded-sm ${enabled ? '' : 'opacity-30'}`}
                  />
                  <span>{country.name}</span>
                  <span className={`text-xs ${enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {enabled ? '표시' : '숨김'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 나라 추가 */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-gray-800">나라 추가</h2>
          <p className="mb-4 text-xs text-gray-500">
            아래에서 나라를 선택하거나 직접 입력해 지구본에 추가하세요. 저장 버튼을 눌러야 반영됩니다.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">빠른 선택 (자동 입력)</label>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value=""
                onChange={(e) => {
                  const preset = COUNTRY_PRESETS.find((p) => p.code === e.target.value);
                  if (preset) {
                    setNewForm({
                      name: preset.name,
                      nameEn: preset.nameEn,
                      code: preset.code,
                      lat: String(preset.lat),
                      lng: String(preset.lng),
                    });
                  }
                }}
              >
                <option value="">-- 나라 선택 --</option>
                {COUNTRY_PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>{p.name} ({p.code.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-gray-500">나라명 (한국어)</label>
                <input
                  type="text"
                  value={newForm.name}
                  onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: 한국"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div style={{ width: 80 }}>
                <label className="mb-1 block text-xs font-semibold text-gray-500">ISO 코드</label>
                <input
                  type="text"
                  value={newForm.code}
                  onChange={(e) => setNewForm((f) => ({ ...f, code: e.target.value.toLowerCase().slice(0, 2) }))}
                  placeholder="kr"
                  maxLength={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {newForm.code.length === 2 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://flagcdn.com/w40/${newForm.code}.png`}
                  alt=""
                  className="mb-0.5 h-8 w-auto rounded-sm shadow-sm"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">위도 (Latitude)</label>
              <input
                type="number"
                value={newForm.lat}
                onChange={(e) => setNewForm((f) => ({ ...f, lat: e.target.value }))}
                placeholder="예: 37.5"
                step="0.1"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">경도 (Longitude)</label>
              <input
                type="number"
                value={newForm.lng}
                onChange={(e) => setNewForm((f) => ({ ...f, lng: e.target.value }))}
                placeholder="예: 127.0"
                step="0.1"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => {
              const lat = parseFloat(newForm.lat);
              const lng = parseFloat(newForm.lng);
              if (!newForm.name.trim() || newForm.code.length !== 2 || isNaN(lat) || isNaN(lng)) {
                alert('나라명, ISO 코드(2자리), 위도, 경도를 모두 입력해 주세요.');
                return;
              }
              const slug = newForm.code.toLowerCase();
              const all = [...COUNTRIES.map((c) => c.slug), ...customCountries.map((c) => c.slug)];
              if (all.includes(slug)) {
                alert(`이미 존재하는 나라 코드입니다 (${slug}). 다른 코드를 사용하세요.`);
                return;
              }
              const entry: CustomCountryData = {
                slug,
                name: newForm.name.trim(),
                nameEn: newForm.nameEn.trim() || newForm.code.toUpperCase(),
                code: slug,
                lat,
                lng,
              };
              setCustomCountries((prev) => [...prev, entry]);
              setEnabledSlugs((prev) => new Set([...Array.from(prev), slug]));
              setNewForm({ name: '', nameEn: '', code: '', lat: '', lng: '' });
            }}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            + 나라 추가
          </button>

          {customCountries.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-semibold text-gray-500">추가된 나라</p>
              <div className="flex flex-wrap gap-2">
                {customCountries.map((c) => (
                  <div
                    key={c.slug}
                    className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w40/${c.code}.png`} alt="" className="h-4 w-auto rounded-sm" />
                    <span className="text-sm font-medium text-blue-800">{c.name}</span>
                    <button
                      onClick={() => {
                        setCustomCountries((prev) => prev.filter((x) => x.slug !== c.slug));
                        setEnabledSlugs((prev) => {
                          const next = new Set(prev);
                          next.delete(c.slug);
                          return next;
                        });
                      }}
                      className="text-blue-400 hover:text-red-500 transition-colors text-sm leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 나라별 템플릿 탭 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {[...COUNTRIES, ...customCountries.map((c) => ({ slug: c.slug, name: c.name, code: c.code }))].map((country) => {
            const count = (config[country.slug] ?? []).length;
            return (
              <button
                key={country.slug}
                onClick={() => setActiveCountry(country.slug)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  activeCountry === country.slug
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${country.code}.png`}
                  alt=""
                  className="h-4 w-auto rounded-sm"
                />
                <span>{country.name}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      activeCountry === country.slug
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagcdn.com/w80/${activeCountryInfo.code}.png`}
              alt={activeCountryInfo.name}
              className="h-8 w-auto rounded shadow-sm"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activeCountryInfo.name}</h2>
              <p className="text-sm text-gray-500">
                템플릿 {activeTemplates.length}개
                {activeTemplates.length > 0 && (
                  <span className="ml-2 text-gray-400">
                    얼굴 합성 {compositeCount}개 / AI 편집 {aiCount}개
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Templates must be {TEMPLATE_RATIO_LABEL}. Recommended minimum resolution:{' '}
                {TEMPLATE_RECOMMENDED_MIN_WIDTH}x{TEMPLATE_RECOMMENDED_MIN_HEIGHT}
              </p>
            </div>
          </div>

          <button
            onClick={() => triggerUpload(activeCountry)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            템플릿 업로드
          </button>
        </div>

        {activeTemplates.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="mb-4 text-5xl">🖼️</div>
            <p className="mb-2 font-medium text-gray-500">
              {activeCountryInfo.name} 템플릿이 아직 없습니다.
            </p>
            <p className="mb-6 text-sm text-gray-400">
              먼저 템플릿 이미지를 올리고 기준 영역을 넉넉하게 지정해 주세요.
            </p>
            <button
              onClick={() => triggerUpload(activeCountry)}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              첫 템플릿 업로드
            </button>
          </div>
        )}

        {activeTemplates.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onTitleChange={(value) =>
                  updateTemplate(activeCountry, template.id, { title: value })
                }
                onBrightnessChange={(value) =>
                  updateTemplate(activeCountry, template.id, { brightness: value })
                }
                onGenerationModeChange={(mode) =>
                  updateTemplate(activeCountry, template.id, { generationMode: mode })
                }
                onPromptChange={(value) =>
                  updateTemplate(activeCountry, template.id, { prompt: value })
                }
                onSetFaceBox={() =>
                  setEditingFaceBox({ templateId: template.id, countrySlug: activeCountry })
                }
                onDelete={() => deleteTemplate(activeCountry, template.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-2 text-sm font-bold text-amber-900">운영 가이드</h3>
          <ol className="list-inside list-decimal space-y-1 text-sm text-amber-800">
            <li>지금 목표라면 새 템플릿은 먼저 `AI 편집` 모드로 두는 것을 추천합니다.</li>
            <li>템플릿 업로드 후 `기준 영역 설정`은 실제로 교체할 고양이 영역만 감싸 주세요. 이제 프레임이 실제 편집 영역과 거의 같게 적용됩니다.</li>
            <li>모든 수정이 끝나면 상단의 `설정 저장`을 눌러 저장합니다.</li>
            <li>프롬프트는 시스템 기본값을 사용하므로 별도로 입력하지 않아도 됩니다.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
