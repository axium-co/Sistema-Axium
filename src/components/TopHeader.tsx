import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, X, User, MessageSquare, Calendar as CalendarIcon, Clock, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCRM } from '../contexts/CRMContext'

function formatRelativeTime(timestamp: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return 'Agora';
  if (diff < 60) return `${diff}min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

interface TopHeaderProps {
  onMenuClick?: () => void;
}

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/crm/painel': { title: 'Painel', subtitle: 'Visão geral das oportunidades' },
  '/crm/leads': { title: 'Leads', subtitle: 'Gestão de contatos e funil' },
  '/crm/pipeline': { title: 'Pipeline', subtitle: 'Progresso das oportunidades' },
  '/crm/calendario': { title: 'Calendário', subtitle: 'Compromissos e agendamentos' },
  '/crm/importar': { title: 'Importar', subtitle: 'Importação de dados externos' },
  '/crm/integracoes': { title: 'Integrações', subtitle: 'Conexões com outras plataformas' },
  '/financeiro': { title: 'Financeiro', subtitle: 'Receitas, despesas e fluxo de caixa' },
  '/tarefas': { title: 'Tarefas', subtitle: 'Atividades e to-dos do dia' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Preferências da aplicação' },
};

const TopHeader = ({ onMenuClick }: TopHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, markNotificationsAsRead, clearNotifications, removeNotification, syncStatus } = useCRM();
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const route = routeTitles[location.pathname] ?? { title: 'Universo Axium', subtitle: '' };

  const hasUnread = notifications.some(n => !n.isRead);

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Usuário';
  const initials = userDisplayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // logout already handles errors internally
    }
    navigate('/login');
  };

  const handleToggleNotifications = () => {
    if (!isNotificationsOpen) {
      markNotificationsAsRead();
    }
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 px-3 md:px-8 py-2.5 md:py-4 flex items-center justify-between transition-all duration-300 safe-area-top min-h-[48px] md:min-h-0">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-md hover:bg-neutral-100 md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-neutral-600" />
      </button>
      
      <div className="min-w-0 flex-1 md:flex-none">
        <h2 className="text-sm md:text-lg font-black text-black tracking-tight leading-none truncate">{route.title}</h2>
        {route.subtitle && (
          <p className="text-[9px] md:text-xs text-neutral-400 font-medium mt-0.5 truncate">{route.subtitle}</p>
        )}
      </div>

      {syncStatus === 'offline' && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded-md mr-1" title="Sem conexão com o servidor">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-red-600 uppercase tracking-widest hidden md:inline">Offline</span>
        </div>
      )}

      <div className="flex items-center gap-1 md:gap-3">
        {/* Notification bell */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={handleToggleNotifications}
            className={`relative p-2.5 rounded-md transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${isNotificationsOpen ? 'bg-neutral-100 text-black' : 'text-neutral-400 hover:text-black hover:bg-neutral-100'}`}
          >
            <Bell className="w-4 h-4" strokeWidth={2} />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-black rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Panel - mobile fullscreen sheet, desktop dropdown */}
          {isNotificationsOpen && (
            <>
              <div className="fixed inset-0 bg-black/20 z-[60] md:hidden" onClick={() => setIsNotificationsOpen(false)} />
              <div className="fixed md:absolute bottom-0 md:bottom-auto md:top-full md:right-0 left-0 md:left-auto right-0 md:right-0 mt-0 md:mt-2 md:w-80 bg-white border-0 md:border border-neutral-200 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in md:zoom-in-95 duration-200 origin-top-right z-[70] max-h-[80dvh] md:max-h-none flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
                  <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Notificações</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded uppercase">Recentes</span>
                    <button onClick={() => setIsNotificationsOpen(false)} className="md:hidden p-1 text-neutral-400 hover:text-black">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 divide-y divide-neutral-50">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-4 md:p-5 hover:bg-neutral-50 transition-colors cursor-pointer group relative ${!n.isRead ? 'bg-neutral-50/50' : ''}`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                          className="absolute top-2 right-2 w-7 h-7 md:w-5 md:h-5 flex items-center justify-center rounded-full text-neutral-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                        <div className="flex gap-3 md:gap-4">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                            n.type === 'lead' ? 'bg-blue-50 text-blue-600' : 
                            n.type === 'meeting' ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-50 text-neutral-600'
                          }`}>
                            {n.type === 'lead' ? <User size={14} /> : 
                             n.type === 'meeting' ? <CalendarIcon size={14} /> : <MessageSquare size={14} />}
                          </div>
                          <div className="space-y-1 pr-4">
                            <p className="text-xs font-black text-black leading-tight">{n.title}</p>
                            <p className="text-[11px] text-neutral-500 font-bold leading-relaxed">{n.description}</p>
                            <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 font-black uppercase tracking-tight mt-2">
                              <Clock size={10} strokeWidth={3} />
                              {formatRelativeTime(n.time)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest italic">Nenhuma notificação</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 md:px-6 py-3 bg-neutral-50 border-t border-neutral-100 text-center shrink-0">
                    <button onClick={clearNotifications} className="text-[9px] font-black text-neutral-400 hover:text-black uppercase tracking-[2px] transition-colors min-h-[44px]">Limpar tudo</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold hover:bg-neutral-800 transition-colors shrink-0 shadow-sm"
            title={user?.email}
          >
            {initials}
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 bg-black/20 z-[60] md:hidden" onClick={() => setIsUserMenuOpen(false)} />
              <div className="fixed md:absolute bottom-0 md:bottom-auto md:top-full md:right-0 left-0 md:left-auto right-0 md:right-0 mt-0 md:mt-2 md:w-56 bg-white border-0 md:border border-neutral-200 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in md:zoom-in-95 duration-200 origin-top-right z-[70]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <div className="px-4 py-4 md:py-3 border-b border-neutral-100 bg-white">
                  <p className="text-sm md:text-xs font-black text-black truncate">{userDisplayName}</p>
                  <p className="text-xs md:text-[10px] text-neutral-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setIsUserMenuOpen(false); navigate('/configuracoes'); }}
                    className="w-full px-4 py-3 md:py-2.5 text-left text-sm md:text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors min-h-[48px] md:min-h-0"
                  >
                    <User className="w-4 h-4" />
                    Perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 md:py-2.5 text-left text-sm md:text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors min-h-[48px] md:min-h-0"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
