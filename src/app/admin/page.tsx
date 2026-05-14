'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AdminCountryConfig, AdminTemplate, FaceBox } from '@/types';

// ─── Country metadata ────────────────────────────────────────────────────────

const COUNTRIES: { slug: string; name: string; code: string }[] = [
  { slug: 'japan',   name: '일본',    code: 'jp' },
  { slug: 'france',  name: '프랑스',  code: 'fr' },
  { slug: 'egypt',   name: '이집트',  code: 'eg' },
  { slug: 'italy',   name: '이탈리아', code: 'it' },
  { slug: 'mexico',  name: '멕시코',  code: 'mx' },
  { slug: 'thailand', name: '태국',   code: 'th' },
];

// ─── Face box editor ─────────────────────────────────────────────────────────

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

function FaceBoxEditor({ templateUrl, initialFaceBox, onSave, onClose }: FaceBoxEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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

  const getRelativePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const rect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getRelativePos(e);
    setDraw({ startX: x, startY: y, endX: x, endY: y, isDragging: true });
  }, [getRelativePos]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setDraw((prev) => {
        if (!prev.isDragging) return prev;
        const { x, y } = getRelativePos(e);
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

  const boxStyle = (() => {
    const left = Math.min(draw.startX, draw.endX) * 100;
    const top = Math.min(draw.startY, draw.endY) * 100;
    const width = Math.abs(draw.endX - draw.startX) * 100;
    const height = Math.abs(draw.endY - draw.startY) * 100;
    return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` };
  })();

  const handleSave = () => {
    if (!hasBox) return;
    const xRatio = Math.min(draw.startX, draw.endX);
    const yRatio = Math.min(draw.startY, draw.endY);
    const wRatio = Math.abs(draw.endX - draw.startX);
    const hRatio = Math.abs(draw.endY - draw.startY);
    onSave({ xRatio, yRatio, wRatio, hRatio });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">얼굴 위치 설정</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              이미지 위에서 클릭 후 드래그하여 고양이 얼굴이 들어갈 영역을 그려주세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Image with draw area */}
        <div className="px-6 py-4">
          <div
            ref={containerRef}
            className="relative select-none overflow-hidden rounded-xl border-2 border-dashed border-blue-300 cursor-crosshair bg-gray-50"
            style={{ maxHeight: '60vh' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={templateUrl}
              alt="템플릿 이미지"
              className="block w-full h-auto"
              style={{ maxHeight: '60vh', objectFit: 'contain' }}
              onLoad={() => setImgLoaded(true)}
              onMouseDown={handleMouseDown}
              draggable={false}
            />
            {imgLoaded && hasBox && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-400/30 pointer-events-none"
                style={boxStyle}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-blue-800 text-xs font-semibold bg-white/70 px-1.5 py-0.5 rounded">
                    얼굴 영역
                  </span>
                </div>
              </div>
            )}
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!hasBox}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

type TemplateCardProps = {
  template: AdminTemplate;
  onTitleChange: (val: string) => void;
  onBrightnessChange: (val: number) => void;
  onSetFaceBox: () => void;
  onDelete: () => void;
};

function TemplateCard({
  template,
  onTitleChange,
  onBrightnessChange,
  onSetFaceBox,
  onDelete,
}: TemplateCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image preview */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={template.url}
          alt={template.title}
          className="w-full h-full object-cover"
          style={{ filter: `brightness(${template.brightness}%)` }}
        />
        {template.faceBox && (
          <div
            className="absolute border-2 border-green-400 bg-green-300/20 rounded"
            style={{
              left: `${template.faceBox.xRatio * 100}%`,
              top: `${template.faceBox.yRatio * 100}%`,
              width: `${template.faceBox.wRatio * 100}%`,
              height: `${template.faceBox.hRatio * 100}%`,
            }}
          />
        )}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              template.faceBox
                ? 'bg-green-500 text-white'
                : 'bg-yellow-400 text-yellow-900'
            }`}
          >
            {template.faceBox ? '얼굴 설정됨' : '얼굴 미설정'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">제목</label>
          <input
            type="text"
            value={template.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="템플릿 이름을 입력하세요"
          />
        </div>

        {/* Brightness */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500">밝기</label>
            <span className="text-xs font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
              {template.brightness}%
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            value={template.brightness}
            onChange={(e) => onBrightnessChange(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>50%</span>
            <span>100%</span>
            <span>150%</span>
          </div>
        </div>

        {/* URL (read-only, truncated) */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">이미지 URL</label>
          <p className="text-xs text-gray-400 truncate bg-gray-50 px-2 py-1 rounded border border-gray-100">
            {template.url}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onSetFaceBox}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            얼굴 위치 설정
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

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

  // ── Load config after login ──────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      // ignore
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginInput }),
      });
      const data = await res.json();
      if (data.ok) {
        setPassword(loginInput);
        setIsLoggedIn(true);
        loadConfig();
      } else {
        setLoginError('비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setLoginError('서버 연결에 실패했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Upload ───────────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadingFor) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);
    form.append('countrySlug', uploadingFor);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-pw': password },
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();

      const newTemplate: AdminTemplate = {
        id: `${uploadingFor}_${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, ''),
        url,
        brightness: 100,
        faceBox: null,
      };

      setConfig((prev) => ({
        ...prev,
        [uploadingFor]: [...(prev[uploadingFor] ?? []), newTemplate],
      }));
    } catch {
      alert('업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploadingFor(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (slug: string) => {
    setUploadingFor(slug);
    // A small delay ensures state is set before click
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  // ── Template mutations ───────────────────────────────────────────────────

  const updateTemplate = (
    countrySlug: string,
    templateId: string,
    patch: Partial<AdminTemplate>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [countrySlug]: (prev[countrySlug] ?? []).map((t) =>
        t.id === templateId ? { ...t, ...patch } : t,
      ),
    }));
  };

  const deleteTemplate = (countrySlug: string, templateId: string) => {
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;
    setConfig((prev) => ({
      ...prev,
      [countrySlug]: (prev[countrySlug] ?? []).filter((t) => t.id !== templateId),
    }));
  };

  const handleFaceBoxSave = (box: FaceBox) => {
    if (!editingFaceBox) return;
    updateTemplate(editingFaceBox.countrySlug, editingFaceBox.templateId, { faceBox: box });
    setEditingFaceBox(null);
  };

  // ── Save config ──────────────────────────────────────────────────────────

  const saveConfig = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pw': password,
        },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // ── Face box editor data ─────────────────────────────────────────────────

  const editingTemplate = editingFaceBox
    ? (config[editingFaceBox.countrySlug] ?? []).find(
        (t) => t.id === editingFaceBox.templateId,
      ) ?? null
    : null;

  // ── Login screen ─────────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🐱</div>
            <h1 className="text-2xl font-bold text-white">세계냥주 관리자</h1>
            <p className="text-slate-400 text-sm mt-1">관리자 비밀번호를 입력하세요</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="비밀번호"
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {loginError && (
              <p className="text-red-400 text-sm text-center">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading || !loginInput}
              className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loginLoading ? '확인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin UI ─────────────────────────────────────────────────────────────

  const activeTemplates = config[activeCountry] ?? [];
  const activeCountryInfo = COUNTRIES.find((c) => c.slug === activeCountry)!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Face box editor overlay */}
      {editingFaceBox && editingTemplate && (
        <FaceBoxEditor
          templateUrl={editingTemplate.url}
          initialFaceBox={editingTemplate.faceBox}
          onSave={handleFaceBoxSave}
          onClose={() => setEditingFaceBox(null)}
        />
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐱</span>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">세계냥주 관리자</h1>
              <p className="text-xs text-gray-400">템플릿 및 설정 관리</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadConfig}
              disabled={configLoading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {configLoading ? '불러오는 중...' : '새로고침'}
            </button>
            <button
              onClick={saveConfig}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                saveStatus === 'saved'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saveStatus === 'saving'
                ? '저장 중...'
                : saveStatus === 'saved'
                ? '저장 완료!'
                : saveStatus === 'error'
                ? '저장 실패'
                : '설정 저장'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Country tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {COUNTRIES.map((country) => {
            const count = (config[country.slug] ?? []).length;
            return (
              <button
                key={country.slug}
                onClick={() => setActiveCountry(country.slug)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCountry === country.slug
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
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
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
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

        {/* Country section */}
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
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
                    <span className="ml-1 text-green-600">
                      (얼굴 설정:{' '}
                      {activeTemplates.filter((t) => t.faceBox !== null).length}개)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => triggerUpload(activeCountry)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              템플릿 업로드
            </button>
          </div>

          {/* Empty state */}
          {activeTemplates.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="text-5xl mb-4">🖼️</div>
              <p className="text-gray-500 font-medium mb-2">
                {activeCountryInfo.name}에 등록된 템플릿이 없습니다
              </p>
              <p className="text-gray-400 text-sm mb-6">
                이미지 파일을 업로드하여 템플릿을 추가하세요.
              </p>
              <button
                onClick={() => triggerUpload(activeCountry)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                첫 번째 템플릿 업로드
              </button>
            </div>
          )}

          {/* Template grid */}
          {activeTemplates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onTitleChange={(val) =>
                    updateTemplate(activeCountry, template.id, { title: val })
                  }
                  onBrightnessChange={(val) =>
                    updateTemplate(activeCountry, template.id, { brightness: val })
                  }
                  onSetFaceBox={() =>
                    setEditingFaceBox({ templateId: template.id, countrySlug: activeCountry })
                  }
                  onDelete={() => deleteTemplate(activeCountry, template.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-10 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-900 mb-2">사용 방법</h3>
          <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
            <li>나라별 탭을 선택하고 <strong>템플릿 업로드</strong> 버튼으로 이미지를 추가합니다.</li>
            <li>각 템플릿의 제목을 입력하고, 밝기 슬라이더로 배경 밝기를 조절합니다.</li>
            <li><strong>얼굴 위치 설정</strong> 버튼을 눌러 고양이 얼굴이 합성될 위치를 드래그로 지정합니다.</li>
            <li>모든 설정이 완료되면 상단의 <strong>설정 저장</strong> 버튼을 눌러 저장합니다.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
