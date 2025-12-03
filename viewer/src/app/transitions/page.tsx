'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSites, getTransitions } from '@/lib/api';
import { Site, TransitionsData } from '@/types/design';
import TransitionDiagram from '@/components/transitions/TransitionDiagram';

export default function TransitionsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [transitions, setTransitions] = useState<TransitionsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSites().then((data) => {
      setSites(data);
      if (data.length > 0) {
        setSelectedSite(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedSite) return;
    setLoading(true);
    getTransitions(selectedSite)
      .then(setTransitions)
      .finally(() => setLoading(false));
  }, [selectedSite]);

  return (
    <div className="h-full flex flex-col">
      {/* ツールバー */}
      <div className="p-4 border-b border-slate-200 flex items-center gap-4">
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
          />
        ) : null}
      </div>

      {/* 凡例 */}
      <div className="p-4 border-t border-slate-200 flex items-center gap-6 text-sm text-slate-600">
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
          <span>外部遷移（他サイト）</span>
        </div>
      </div>
    </div>
  );
}
