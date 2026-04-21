import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, DollarSign, CheckCircle, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-neutral-200 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6 border-b border-neutral-100">
        <img
          src="/logo.png"
          alt="Universo Axium"
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
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
      <div className="px-4 pb-6 border-t border-neutral-100 pt-4">
        {user && (
          <div className="mb-3 px-2">
            <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider mb-0.5">Conectado como</p>
            <p className="text-sm text-neutral-700 font-medium truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-neutral-500 hover:text-red-600 hover:bg-red-50 font-medium text-sm"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span>Sair</span>
        </button>
        <p className="text-[11px] text-neutral-300 text-center mt-4">© 2026 Universo Axium</p>
      </div>
    </aside>
  );
};

export default Sidebar;
