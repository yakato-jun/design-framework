'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSites } from '@/lib/api';
import { Site } from '@/types/design';
import { useState } from 'react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: () => void;
}

export default function MobileDrawer({ isOpen, onClose, onNavigate }: MobileDrawerProps) {
  const pathname = usePathname();
  const [sites, setSites] = useState<Site[]>([]);
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSites().then(setSites).catch(console.error);
  }, []);

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const toggleSite = (siteId: string) => {
    setExpandedSites((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) {
        next.delete(siteId);
      } else {
        next.add(siteId);
      }
      return next;
    });
  };

  const isActive = (path: string) => pathname === path;

  const handleLinkClick = () => {
    onNavigate();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ背景 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ドロワー本体 (rightAligned) */}
      <div
        className="fixed inset-y-0 right-0 w-72 bg-slate-100 z-50 shadow-xl transform transition-transform duration-300 ease-in-out md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="モバイルナビゲーション"
      >
        {/* ドロワーヘッダー */}
        <div className="h-14 bg-slate-800 text-white flex items-center justify-between px-4 border-b border-slate-700">
          <span className="text-lg font-semibold">メニュー</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-md"
            aria-label="メニューを閉じる"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="p-4 overflow-y-auto h-[calc(100%-3.5rem)]">
          {/* メインナビゲーション */}
          <div className="mb-6">
            <Link
              href="/"
              onClick={handleLinkClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                isActive('/') ? 'bg-slate-800 text-white' : 'hover:bg-slate-200'
              }`}
            >
              <span>🏠</span>
              <span>ダッシュボード</span>
            </Link>
            <Link
              href="/transitions"
              onClick={handleLinkClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                isActive('/transitions')
                  ? 'bg-slate-800 text-white'
                  : 'hover:bg-slate-200'
              }`}
            >
              <span>🔀</span>
              <span>画面遷移図</span>
            </Link>
          </div>

          {/* サイト/画面ツリー */}
          <div className="border-t border-slate-300 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Sites
            </h3>
            {sites.map((site) => (
              <div key={site.id} className="mb-2">
                <button
                  onClick={() => toggleSite(site.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-200 rounded-md"
                >
                  <span>{expandedSites.has(site.id) ? '📂' : '📁'}</span>
                  <span className="font-medium">{site.name}</span>
                </button>
                {expandedSites.has(site.id) && (
                  <div className="ml-6 mt-1 space-y-1">
                    <Link
                      href={`/screens/${site.id}/dashboard`}
                      onClick={handleLinkClick}
                      className={`block px-3 py-1 text-sm rounded ${
                        pathname.includes(`/screens/${site.id}/dashboard`)
                          ? 'bg-slate-700 text-white'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      dashboard
                    </Link>
                    <Link
                      href={`/screens/${site.id}/transitions`}
                      onClick={handleLinkClick}
                      className={`block px-3 py-1 text-sm rounded ${
                        pathname.includes(`/screens/${site.id}/transitions`)
                          ? 'bg-slate-700 text-white'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      transitions
                    </Link>
                    <Link
                      href={`/screens/${site.id}/screen-detail`}
                      onClick={handleLinkClick}
                      className={`block px-3 py-1 text-sm rounded ${
                        pathname.includes(`/screens/${site.id}/screen-detail`)
                          ? 'bg-slate-700 text-white'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      screen-detail
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
