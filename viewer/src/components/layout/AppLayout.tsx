'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={openMobileMenu} />
      <div className="flex flex-1">
        {/* サイドバー: デスクトップのみ表示 (md:block) */}
        <Sidebar className="hidden md:block" onNavigate={closeMobileMenu} />
        <main className="flex-1 bg-white overflow-auto">{children}</main>
      </div>

      {/* モバイルドロワー: モバイルのみ表示 */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        onNavigate={closeMobileMenu}
      />
    </div>
  );
}
