'use client';

import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-14 bg-slate-800 text-white flex items-center px-4 border-b border-slate-700">
      {/* アプリタイトル (leftAligned) */}
      <Link href="/" className="text-xl font-bold hover:text-slate-200">
        Design Viewer
      </Link>

      {/* スペーサー */}
      <div className="flex-1" />

      {/* ハンバーガーメニュー: モバイルのみ表示 (rightAligned) */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 hover:bg-slate-700 rounded-md"
        aria-label="メニューを開く"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* 将来的な拡張用 (rightAligned) - header-nav */}
    </header>
  );
}
