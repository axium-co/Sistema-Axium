import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CRMSubmenu from '../components/CRMSubmenu';
import TopHeader from '../components/TopHeader';
import { FilterBar } from '../components/filtros/FilterBar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const isCRMRoute = location.pathname.startsWith('/crm');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Fixed sidebar - w-64 (256px) only on desktop */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area: full width on mobile, ml-64 on desktop */}
      <main className="flex-1 ml-0 md:ml-64 flex flex-col overflow-y-auto w-full">
        {/* 
          TopHeader is sticky so it stays at the top of this scrollable container.
          bg-white/70 + backdrop-blur lets the page content bleed through on scroll.
        */}
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* CRM sub-tabs — also sticky, sits just below the header */}
        {isCRMRoute && (
          <div className="sticky top-[61px] z-20">
            <CRMSubmenu />
          </div>
        )}

        {/* Global Filter Bar — sticky below submenu, visible on all pages */}
        <div className="sticky top-[61px] z-10 bg-white border-b border-neutral-100 px-4 py-2">
          <FilterBar />
        </div>

        {/* Page content */}
        <div className="flex-1 bg-neutral-50 w-full">
          <div className="px-4 p-4 md:p-8 w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;