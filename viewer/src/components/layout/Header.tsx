'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="h-14 bg-slate-800 text-white flex items-center px-4 border-b border-slate-700">
      <Link href="/" className="text-xl font-bold hover:text-slate-200">
        Design Viewer
      </Link>
    </header>
  );
}
