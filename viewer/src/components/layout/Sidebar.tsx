'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSites } from '@/lib/api';
import { Site } from '@/types/design';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export default function Sidebar({ className = '', onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [sites, setSites] = useState<Site[]>([]);
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSites().then(setSites).catch(console.error);
  }, []);

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
    onNavigate?.();
  };

  return (
    <aside className={`w-64 bg-slate-100 border-r border-slate-200 overflow-y-auto ${className}`}>
      <nav className="p-4">
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
    </aside>
  );
}
