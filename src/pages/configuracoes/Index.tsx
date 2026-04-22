import { useState, useEffect } from 'react';
import { 
  Mail, Lock, Bell, Palette, User, 
  AlertTriangle, X, ShieldAlert, Trash2, 
  Save, CheckCircle2, ShieldCheck, 
  Settings as SettingsIcon, Globe, 
  UserCircle, Smartphone, Eye, EyeOff,
  Sun, Moon, Monitor, Check, Server,
  Key, Hash, Send, Bold, Italic, Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

type ModalType = 'perfil' | 'seguranca' | 'notificacoes' | 'tema' | 'email' | 'delete' | null;

const Configuracoes = () => {
  const { user, logout } = useAuth();
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const navigate = useNavigate();
  
  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Form States
  const [profileData, setProfileData] = useState({ name: 'Admin Axium', email: user?.email || '', phone: '(11) 99999-9999' });
  const [smtpData, setSmtpData] = useState(() => {
    const stored = localStorage.getItem('axium_smtp_config');
    return stored ? JSON.parse(stored) : { server: 'smtp.gmail.com', port: '465', user: '', password: '', signature: '' };
  });
  const [isSaved, setIsSaved] = useState(false);

  const sections = [
    {
      id: 'perfil' as ModalType,
      icon: User,
      title: 'Perfil',
      description: 'Gerencie nome, email e foto de perfil',
      items: ['Nome', 'Email', 'Foto de perfil'],
    },
    {
      id: 'seguranca' as ModalType,
      icon: Lock,
      title: 'Segurança',
      description: 'Altere a senha e configure autenticação',
      items: ['Alterar senha', 'Autenticação 2FA', 'Sessões ativas'],
    },
    {
      id: 'notificacoes' as ModalType,
      icon: Bell,
      title: 'Notificações',
      description: 'Configure alertas por email, push ou SMS',
      items: ['Email', 'Push', 'SMS'],
    },
    {
      id: 'tema' as ModalType,
      icon: Palette,
      title: 'Tema',
      description: 'Personalizar aparência da interface',
      items: ['Dark Mode', 'Light Mode', 'Auto'],
    },
    {
      id: 'email' as ModalType,
      icon: Mail,
      title: 'Email',
      description: 'SMTP, assinatura e templates de email',
      items: ['SMTP', 'Assinatura', 'Templates'],
    },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal === 'email') {
      localStorage.setItem('axium_smtp_config', JSON.stringify(smtpData));
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setActiveModal(null);
    }, 1500);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    // Simulate SMTP handshake
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTestResult('success');
    setIsTestingConnection(false);
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE') return;
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith('axium_'));
    keysToRemove.forEach(key => localStorage.removeItem(key));
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter mb-1">Configurações</h1>
          <p className="text-neutral-500 text-sm font-medium">Controle central de segurança, perfil e preferências.</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="bg-white border border-neutral-200 rounded-3xl p-8 hover:border-black transition-all group relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black transition-colors">
                    <Icon className="w-8 h-8 text-neutral-400 group-hover:text-white transition-colors" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-black text-lg tracking-tight">{section.title}</h3>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">{section.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(section.id)}
                  className="bg-black text-white px-6 py-3 rounded-md font-black text-[11px] uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-[0.95] shadow-lg shadow-black/10"
                >
                  Configurar
                </button>
              </div>

              <div className="flex gap-2 flex-wrap mt-8 pt-8 border-t border-neutral-50">
                {section.items.map((item, itemIdx) => (
                  <span key={itemIdx} className="px-4 py-2 bg-neutral-50 text-neutral-400 text-[10px] font-black uppercase tracking-[1.5px] rounded-md border border-neutral-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Danger Zone Section */}
      <div className="mt-12 max-w-2xl border-2 border-red-50 bg-red-50/20 rounded-[40px] p-10 relative overflow-hidden group/danger">
        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover/danger:opacity-10 transition-opacity">
          <ShieldAlert size={240} className="text-red-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <h3 className="font-black text-red-600 uppercase tracking-widest text-sm">Zona de Perigo</h3>
          </div>
          <p className="text-sm text-neutral-500 font-bold leading-relaxed mb-8 max-w-md">Estas ações são irreversíveis e deletarão todos os seus dados e leads permanentemente.</p>
          <button 
            onClick={() => setActiveModal('delete')}
            className="text-[11px] font-black uppercase tracking-[2px] bg-white border-2 border-red-100 text-red-600 px-10 py-4 rounded-2xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-xl shadow-red-100/50 active:scale-[0.98]"
          >
            Deletar Conta Permanentemente
          </button>
        </div>
      </div>

      {/* Configuration Modal Orchestrator */}
      {activeModal && activeModal !== 'delete' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-neutral-200 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500">
            <form onSubmit={handleSave}>
              <div className="px-12 py-10 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/30">
                <div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[3px] mb-3 block">Preferências do Sistema</span>
                  <h2 className="text-4xl font-black text-black tracking-tighter">
                    {activeModal === 'perfil' && 'Configurações de Perfil'}
                    {activeModal === 'seguranca' && 'Segurança da Conta'}
                    {activeModal === 'notificacoes' && 'Alertas & Avisos'}
                    {activeModal === 'tema' && 'Personalizar Tema'}
                    {activeModal === 'email' && 'Integração de Email'}
                  </h2>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  className="p-3 hover:bg-white rounded-2xl transition-colors text-neutral-300 hover:text-black border border-transparent hover:border-neutral-200 shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {activeModal === 'perfil' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-8 mb-4">
                      <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center relative group/avatar cursor-pointer">
                        <UserCircle size={48} className="text-white" />
                        <div className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest text-center px-2">Alterar Foto</div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-black text-black text-lg">Avatar do Administrador</h4>
                        <p className="text-xs text-neutral-400 font-medium">Clique para fazer upload de um novo arquivo PNG ou JPG.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Email Profissional</label>
                        <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'seguranca' && (
                  <div className="space-y-8">
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                      <ShieldCheck className="text-emerald-500" size={32} />
                      <div>
                        <p className="text-sm font-black text-emerald-900">Sua conta está segura</p>
                        <p className="text-xs text-emerald-600 font-medium italic">Proteção em tempo real ativada.</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Senha Atual</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-black">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Nova Senha</label>
                          <input type="password" placeholder="Mínimo 8 caracteres" className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                          <input type="password" placeholder="Repita a nova senha" className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'tema' && (
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 block">Modo de Visualização</label>
                      <div className="grid grid-cols-3 gap-6">
                        {[
                          { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Claro e Limpo' },
                          { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Cinza Profundo' },
                          { id: 'system', label: 'Sistema', icon: Monitor, desc: 'Automático' },
                        ].map((t) => (
                          <button key={t.id} type="button" onClick={() => setTheme(t.id as any)} className={`p-6 rounded-[32px] border-2 transition-all text-left relative group ${theme === t.id ? 'border-black bg-black text-white shadow-xl shadow-black/20' : 'border-neutral-100 bg-neutral-50 text-neutral-400 hover:border-neutral-200'}`}>
                            <t.icon size={24} className={`mb-4 ${theme === t.id ? 'text-white' : 'text-neutral-300'}`} />
                            <p className="font-black text-sm mb-1">{t.label}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === t.id ? 'text-white/50' : 'text-neutral-300'}`}>{t.desc}</p>
                            {theme === t.id && <div className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center"><Check size={14} className="text-black" strokeWidth={4} /></div>}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 block">Cor de Destaque (Accent)</label>
                      <div className="flex gap-4">
                        {[{ id: 'blue', color: 'bg-blue-500' }, { id: 'purple', color: 'bg-purple-500' }, { id: 'green', color: 'bg-green-500' }, { id: 'gold', color: 'bg-yellow-500' }, { id: 'black', color: 'bg-black' }].map((c) => (
                          <button key={c.id} type="button" onClick={() => setAccentColor(c.id as any)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${c.color} ${accentColor === c.id ? 'ring-4 ring-neutral-100 scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'}`}>{accentColor === c.id && <Check size={20} className="text-white" strokeWidth={3} />}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'email' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Server size={12} className="text-blue-500" /> Servidor SMTP</label>
                        <input type="text" placeholder="smtp.gmail.com" value={smtpData.server} onChange={(e) => setSmtpData({...smtpData, server: e.target.value})} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Hash size={12} className="text-purple-500" /> Porta</label>
                        <input type="text" placeholder="465" value={smtpData.port} onChange={(e) => setSmtpData({...smtpData, port: e.target.value})} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-2"><User size={12} className="text-amber-500" /> Usuário / Email</label>
                        <input type="email" placeholder="admin@axium.com" value={smtpData.user} onChange={(e) => setSmtpData({...smtpData, user: e.target.value})} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Key size={12} className="text-emerald-500" /> Senha do App</label>
                        <input type="password" value={smtpData.password} onChange={(e) => setSmtpData({...smtpData, password: e.target.value})} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Assinatura de Email</label>
                        <div className="flex gap-2">
                          <button type="button" className="p-2 bg-neutral-100 rounded-md hover:bg-neutral-200 text-neutral-600 transition-all"><Bold size={14} /></button>
                          <button type="button" className="p-2 bg-neutral-100 rounded-md hover:bg-neutral-200 text-neutral-600 transition-all"><Italic size={14} /></button>
                          <button type="button" className="p-2 bg-neutral-100 rounded-md hover:bg-neutral-200 text-neutral-600 transition-all"><LinkIcon size={14} /></button>
                        </div>
                      </div>
                      <textarea 
                        className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-[32px] px-8 py-6 font-bold text-black focus:border-black outline-none transition-all h-40 resize-none leading-relaxed"
                        placeholder="Atenciosamente, Admin Axium..."
                        value={smtpData.signature}
                        onChange={(e) => setSmtpData({...smtpData, signature: e.target.value})}
                      />
                    </div>

                    <div className="flex justify-center">
                      <button 
                        type="button" 
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all ${
                          testResult === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
                          testResult === 'error' ? 'bg-red-500 text-white shadow-lg shadow-red-200' :
                          'bg-neutral-100 text-neutral-400 hover:bg-black hover:text-white'
                        }`}
                      >
                        {isTestingConnection ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                        {testResult === 'success' ? 'Conexão Estabelecida!' : testResult === 'error' ? 'Falha na Conexão' : 'Testar Conexão SMTP'}
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === 'notificacoes' && (
                  <div className="py-20 text-center space-y-4">
                    <SettingsIcon size={64} className="mx-auto text-neutral-100 animate-spin-slow" />
                    <p className="text-neutral-400 font-black text-[10px] uppercase tracking-[4px]">Área em Desenvolvimento</p>
                    <p className="text-sm text-neutral-500 font-medium max-w-xs mx-auto leading-relaxed">As configurações detalhadas de {activeModal} estarão disponíveis na próxima atualização do sistema.</p>
                  </div>
                )}
              </div>

              <div className="px-12 py-10 bg-neutral-50 flex gap-4">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">Cancelar</button>
                <button type="submit" className="flex-[2] text-white py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:brightness-90 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3" style={{ backgroundColor: 'var(--primary)' }}>
                  {isSaved ? <><CheckCircle2 size={18} /> Configurações Salvas</> : <><Save size={18} /> Salvar Integração</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {activeModal === 'delete' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border-2 border-red-100 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden p-12 text-center transform animate-in slide-in-from-bottom-8">
            <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-bounce"><Trash2 size={48} className="text-red-600" /></div>
            <h2 className="text-4xl font-black text-black tracking-tighter mb-4">Tem certeza?</h2>
            <p className="text-neutral-500 text-sm font-bold leading-relaxed mb-10">Esta ação é irreversível e apagará todos os dados permanentemente.</p>
            <div className="space-y-8 text-left">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block text-center">Digite <span className="text-black font-black">DELETE</span> para confirmar</label>
                <input autoFocus type="text" value={confirmationText} onChange={(e) => setConfirmationText(e.target.value)} placeholder="CONFIRMAÇÃO" className="w-full bg-red-50/50 border-2 border-red-100 rounded-3xl px-8 py-5 text-center text-xl font-black text-red-600 focus:border-red-600 outline-none" />
              </div>
              <div className="flex flex-col gap-4">
                <button disabled={confirmationText !== 'DELETE' || isDeleting} onClick={handleDeleteAccount} className={`w-full py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[2px] shadow-2xl transition-all flex items-center justify-center gap-3 ${confirmationText === 'DELETE' ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200' : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'}`}>{isDeleting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : 'Deletar Conta e Dados'}</button>
                <button onClick={() => { setActiveModal(null); setConfirmationText(''); }} className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracoes;
