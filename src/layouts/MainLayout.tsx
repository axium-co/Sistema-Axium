import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CRMSubmenu from '../components/CRMSubmenu';
import TopHeader from '../components/TopHeader';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const isCRMRoute = location.pathname.startsWith('/crm');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Fixed sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area: scrollable column to the right of the sidebar */}
      <main className="flex-1 ml-0 md:ml-64 flex flex-col overflow-y-auto">
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

        {/* Page content */}
        <div className="flex-1 bg-neutral-50">
          <div className="px-4 p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;