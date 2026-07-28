import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CRMSubmenu from '../components/CRMSubmenu';
import TopHeader from '../components/TopHeader';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, BarChart4, DollarSign, CheckCircle, Settings } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const isCRMRoute = location.pathname.startsWith('/crm');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-dvh bg-neutral-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col overflow-y-auto w-full scroll-smooth">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />

        {isCRMRoute && (
          <div className="md:sticky md:top-[56px] md:z-20">
            <CRMSubmenu />
          </div>
        )}

        <div className="flex-1 bg-neutral-50 w-full pb-safe-bottom">
          <div className="px-3 md:px-8 py-3 md:py-8 w-full max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar - Mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-neutral-200/80 flex items-center justify-around md:hidden safe-area-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingTop: 'env(safe-area-inset-bottom, 0px)', boxShadow: '0 -1px 12px rgba(0,0,0,0.06)' }}>
        {[
          { id: 'crm', label: 'CRM', icon: BarChart3, path: '/crm', allowedRoles: ['admin', 'manager', 'user'] as const },
          { id: 'financeiro', label: 'Financeiro', icon: DollarSign, path: '/financeiro', allowedRoles: ['admin', 'manager'] as const },
          { id: 'tarefas', label: 'Tarefas', icon: CheckCircle, path: '/tarefas', allowedRoles: ['admin', 'manager', 'user'] as const },
          { id: 'landing', label: 'Landing', icon: BarChart4, path: '/landing', allowedRoles: ['admin', 'manager', 'user'] as const },
          { id: 'configuracoes', label: 'Config', icon: Settings, path: '/configuracoes', allowedRoles: ['admin'] as const },
        ].filter(item => item.allowedRoles.includes(user?.role as any)).map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 min-h-[56px] min-w-[56px] transition-all duration-200 ${
                active ? 'text-black' : 'text-neutral-400 active:text-neutral-600'
              }`}
            >
              {active && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black rounded-full" />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} className="transition-all duration-200" />
              <span className={`text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                active ? 'text-black' : 'text-neutral-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MainLayout;