import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CRMSubmenu from '../components/CRMSubmenu';
import TopHeader from '../components/TopHeader';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, DollarSign, CheckCircle, Settings } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const isCRMRoute = location.pathname.startsWith('/crm');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { 
    user,
  } = useAuth();

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col overflow-y-auto w-full">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />

        {isCRMRoute && (
          <div className="md:sticky md:top-[56px] md:z-20">
            <CRMSubmenu />
          </div>
        )}

        <div className="flex-1 bg-neutral-50 w-full pb-16 md:pb-0">
          <div className="px-4 p-4 pt-2 md:p-8 w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar - Mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 flex items-center justify-around md:hidden safe-area-bottom">
        {[
          { id: 'crm', label: 'CRM', icon: BarChart3, path: '/crm', allowedRoles: ['admin', 'manager', 'user'] as const },
          { id: 'financeiro', label: 'Financeiro', icon: DollarSign, path: '/financeiro', allowedRoles: ['admin', 'manager'] as const },
          { id: 'tarefas', label: 'Tarefas', icon: CheckCircle, path: '/tarefas', allowedRoles: ['admin', 'manager', 'user'] as const },
          { id: 'configuracoes', label: 'Config', icon: Settings, path: '/configuracoes', allowedRoles: ['admin'] as const },
        ].filter(item => item.allowedRoles.includes(user?.role as any)).map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-h-[56px] transition-colors ${
                active ? 'text-black' : 'text-neutral-400'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className={`text-[9px] font-black uppercase tracking-wider ${
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