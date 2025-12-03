'use client';

import { useEffect, useState, useMemo } from 'react';
import { getSites, getTransitions, getSiteDetail, SiteDetail } from '@/lib/api';
import { Site, TransitionsData, Viewport } from '@/types/design';
import TransitionDiagram from '@/components/transitions/TransitionDiagram';

export default function TransitionsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null);
  const [transitions, setTransitions] = useState<TransitionsData | null>(null);
  const [loading, setLoading] = useState(false);

  // viewportsからデフォルトビューポートを決定
  const viewports = useMemo(() => siteDetail?.viewports || [], [siteDetail]);
  const defaultViewportId = useMemo(() => {
    if (viewports.length === 0) return 'desktop';
    const sorted = [...viewports].sort((a, b) => (b.minWidth || 0) - (a.minWidth || 0));
    return sorted[0].id;
  }, [viewports]);

  const [viewportId, setViewportId] = useState<string>(defaultViewportId);

  // viewportsが変更されたらviewportIdを更新
  useEffect(() => {
    if (viewports.length > 0 && !viewports.find(v => v.id === viewportId)) {
      setViewportId(defaultViewportId);
    }
  }, [viewports, viewportId, defaultViewportId]);

  useEffect(() => {
    getSites().then((data) => {
      setSites(data);
      if (data.length > 0) {
        setSelectedSite(data[0].id);
      }
    });
  }, []);

  // サイト変更時にサイト詳細を取得
  useEffect(() => {
    if (!selectedSite) return;
    getSiteDetail(selectedSite).then(setSiteDetail);
  }, [selectedSite]);

  // サイトまたはviewport変更時に遷移データを取得
  useEffect(() => {
    if (!selectedSite) return;
    setLoading(true);
    getTransitions(selectedSite, viewportId)
      .then(setTransitions)
      .finally(() => setLoading(false));
  }, [selectedSite, viewportId]);

  return (
    <div className="h-full flex flex-col">
      {/* ツールバー */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4">
        {/* サイト選択 (leftAligned) */}
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">サイト:</span>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>

        {/* ビューポート切り替え (viewport-toggle) */}
        {viewports.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">表示:</span>
            <div className="flex items-center gap-1">
              {viewports.map((vp) => (
                <button
                  key={vp.id}
                  onClick={() => setViewportId(vp.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    viewportId === vp.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                  title={vp.description || vp.name}
                >
                  {vp.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 遷移図 */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-slate-500">読み込み中...</span>
          </div>
        ) : transitions ? (
          <TransitionDiagram
            data={transitions}
            siteId={selectedSite}
            viewportId={viewportId}
          />
        ) : null}
      </div>

      {/* 凡例 */}
      <div className="p-4 border-t border-slate-200 flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ background: '#f8fafc', border: '2px solid #475569' }}
          />
          <span>画面</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ background: '#e0e7ff', border: '2px solid #6366f1' }}
          />
          <span>共通部品</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-slate-600"></div>
          <span>内部遷移</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-slate-400"></div>
          <span>外部遷移</span>
        </div>
      </div>
    </div>
  );
}
