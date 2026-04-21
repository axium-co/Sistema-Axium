import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, DollarSign, CheckCircle, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const mainMenuItems = [
    { id: 'crm', label: 'CRM', icon: BarChart3, path: '/crm' },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, path: '/financeiro' },
    { id: 'tarefas', label: 'Tarefas', icon: CheckCircle, path: '/tarefas' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/configuracoes' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed md:hidden left-0 top-0 h-screen w-64 bg-white border-r border-neutral-200 flex-col overflow-y-auto z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-100 md:hidden"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5 text-neutral-600" />
        </button>
        
        {/* Logo */}
        <div className="px-4 md:px-6 pt-6 md:pt-8 pb-4 md:pb-6 border-b border-neutral-100">
          <img
            src="/logo.png"
            alt="Universo Axium"
            className="h-8 md:h-10 w-auto object-contain"
          />
        </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 md:px-4 py-4 md:py-6 space-y-1">
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`sidebar-item ${active ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 md:px-4 pb-4 md:pb-6 border-t border-neutral-100 pt-3 md:pt-4">
        {user && (
          <div className="mb-2 md:mb-3 px-2">
            <p className="text-[10px] md:text-[11px] text-neutral-400 font-medium uppercase tracking-wider mb-0.5">Conectado como</p>
            <p className="text-xs md:text-sm text-neutral-700 font-medium truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-neutral-500 hover:text-red-600 hover:bg-red-50 font-medium text-xs md:text-sm"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span>Sair</span>
        </button>
        <p className="text-[10px] md:text-[11px] text-neutral-300 text-center mt-3 md:mt-4">© 2026 Universo Axium</p>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
