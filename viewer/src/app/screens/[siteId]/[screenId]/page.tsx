'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getScreenDetail } from '@/lib/api';
import { ScreenDetail, ResolvedArea, ResolvedElement } from '@/types/design';
import LayoutViewer from '@/components/screen-detail/LayoutViewer';
import PropertyPanel from '@/components/screen-detail/PropertyPanel';

export default function ScreenDetailPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const screenId = params.screenId as string;

  const [screenData, setScreenData] = useState<ScreenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<ResolvedElement | null>(null);
  const [selectedArea, setSelectedArea] = useState<ResolvedArea | null>(null);

  useEffect(() => {
    setLoading(true);
    getScreenDetail(siteId, screenId)
      .then(setScreenData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [siteId, screenId]);

  const handleElementSelect = (element: ResolvedElement | null) => {
    setSelectedElement(element);
    setSelectedArea(null);
  };

  const handleAreaSelect = (area: ResolvedArea | null) => {
    setSelectedArea(area);
    setSelectedElement(null);
  };

  const handleDeselect = () => {
    setSelectedElement(null);
    setSelectedArea(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-slate-500">読み込み中...</span>
      </div>
    );
  }

  if (!screenData) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-red-500">画面データが見つかりません</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b border-slate-200">
        <div className="text-sm text-slate-500 mb-1">
          {siteId} / {screenId}
        </div>
        <h1 className="text-xl font-bold text-slate-800">{screenData.title}</h1>
        {screenData.description && (
          <p className="text-sm text-slate-600 mt-1">{screenData.description}</p>
        )}
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* SVGレイアウトビューア */}
        <div className="flex-1 overflow-auto">
          <LayoutViewer
            screenData={screenData}
            selectedElement={selectedElement}
            selectedArea={selectedArea}
            onElementSelect={handleElementSelect}
            onAreaSelect={handleAreaSelect}
            onDeselect={handleDeselect}
          />
        </div>

        {/* プロパティパネル */}
        <div className="w-80 border-l border-slate-200 overflow-auto">
          <PropertyPanel
            selectedElement={selectedElement}
            selectedArea={selectedArea}
          />
        </div>
      </div>
    </div>
  );
}
