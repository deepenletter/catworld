'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AdminCountryConfig,
  AdminTemplate,
  FaceBox,
  TemplateGenerationMode,
} from '@/types';
import {
  getTemplateGenerationMode,
  normalizeAdminConfig,
} from '@/lib/adminConfig';
import { DEFAULT_FACE_SWAP_PROMPT } from '@/lib/faceSwap';

const COUNTRIES: { slug: string; name: string; code: string }[] = [
  { slug: 'japan', name: '일본', code: 'jp' },
  { slug: 'france', name: '프랑스', code: 'fr' },
  { slug: 'egypt', name: '이집트', code: 'eg' },
  { slug: 'italy', name: '이탈리아', code: 'it' },
  { slug: 'mexico', name: '멕시코', code: 'mx' },
  { slug: 'thailand', name: '태국', code: 'th' },
];

type DrawState = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isDragging: boolean;
};

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
            <h3 className="text-lg font-bold text-gray-900">얼굴 위치 설정</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              템플릿 안에서 고양이 얼굴이 들어갈 영역을 드래그해 주세요.
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
                    얼굴 영역
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
  onPromptChange: (value: string) => void;
  onGenerationModeChange: (mode: TemplateGenerationMode) => void;
  onSetFaceBox: () => void;
  onDelete: () => void;
};

function TemplateCard({
  template,
  onTitleChange,
  onBrightnessChange,
  onPromptChange,
  onGenerationModeChange,
  onSetFaceBox,
  onDelete,
}: TemplateCardProps) {
  const mode = getTemplateGenerationMode(template);
  const isComposite = mode === 'composite';
  const isReady = isComposite
    ? !!template.faceBox
    : !!template.faceBox && !!template.prompt.trim();

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-video overflow-hidden bg-gray-100">
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
              ? '현재 목표에 가장 잘 맞는 방식입니다. 얼굴 박스만 맞추면 바로 운영할 수 있습니다.'
              : 'OpenAI API 키가 필요하고, 프롬프트 기반으로 템플릿을 다시 편집합니다.'}
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
            <label className="text-xs font-semibold text-gray-500">AI 프롬프트</label>
            {!isComposite && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                AI에서 사용
              </span>
            )}
          </div>
          <textarea
            value={template.prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            rows={5}
            className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-xs leading-relaxed focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="AI 편집 모드에서 사용할 프롬프트를 입력하세요."
          />
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
            얼굴 위치 설정
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

    const form = new FormData();
    form.append('file', file);
    form.append('countrySlug', uploadingFor);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-pw': password },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Upload failed');

      const newTemplate: AdminTemplate = {
        id: `${uploadingFor}_${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, ''),
        url: data.url,
        brightness: 100,
        faceBox: null,
        prompt: DEFAULT_FACE_SWAP_PROMPT,
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
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pw': password,
        },
        body: JSON.stringify(config),
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
  const activeCountryInfo = COUNTRIES.find((country) => country.slug === activeCountry)!;
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
        <div className="mb-8 flex flex-wrap gap-2">
          {COUNTRIES.map((country) => {
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
              먼저 템플릿 이미지를 올리고 얼굴 위치를 지정해 주세요.
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
                onPromptChange={(value) =>
                  updateTemplate(activeCountry, template.id, { prompt: value })
                }
                onGenerationModeChange={(mode) =>
                  updateTemplate(activeCountry, template.id, { generationMode: mode })
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
            <li>지금 목표라면 새 템플릿은 먼저 `얼굴 합성` 모드로 두는 것을 추천합니다.</li>
            <li>템플릿 업로드 후 `얼굴 위치 설정`으로 고양이 얼굴이 들어갈 영역을 지정합니다.</li>
            <li>모든 수정이 끝나면 상단의 `설정 저장`을 눌러 저장합니다.</li>
            <li>AI 편집은 선택 사항입니다. 프롬프트와 OpenAI API 키가 있을 때만 사용하세요.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
