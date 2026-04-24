import { useState, useEffect, useRef } from 'react';
import { 
  Mail, Lock, Bell, User, 
  AlertTriangle, X, ShieldAlert, Trash2, 
  Save, CheckCircle2, ShieldCheck, 
  UserCircle, Smartphone, Eye, EyeOff,
  Sun, Moon, Check, Server,
  Key, Hash, Send, Bold, Italic, Link as LinkIcon,
  RefreshCw, Users, Copy, CheckCircle,
  AlertCircle, CheckCircle as CheckCircleIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, PROFILES_TABLE } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

type ModalType = 'perfil' | 'seguranca' | 'notificacoes' | 'tema' | 'email' | 'delete' | 'equipe' | null;
type NotificationType = 'email' | 'push' | 'sms';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

const Configuracoes = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Error/Success states
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [notificationsError, setNotificationsError] = useState('');
  const [notificationsSuccess, setNotificationsSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Socio' | 'Funcionario'>('Funcionario');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', avatar: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPassword: '', confirm: '' });
  const [notifications, setNotifications] = useState<NotificationSettings>({ email: true, push: true, sms: false });
  const [smtpData, setSmtpData] = useState(() => {
    try {
      const stored = localStorage.getItem('axium_smtp_config');
      return stored ? JSON.parse(stored) : { server: 'smtp.gmail.com', port: '465', user: '', password: '', signature: '' };
    } catch {
      return { server: 'smtp.gmail.com', port: '465', user: '', password: '', signature: '' };
    }
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from(PROFILES_TABLE)
          .select('nome, telefone, avatar')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          if (error.code === '404' || error.message?.includes('not found') || error.message?.includes('no rows')) {
            console.warn('Profiles table not found, using defaults');
            setProfileData({ name: '', email: user.email || '', phone: '(11) 99999-9999', avatar: '' });
            return;
          }
          console.warn('Profile load error:', error.message);
          setProfileData({ name: '', email: user.email || '', phone: '(11) 99999-9999', avatar: '' });
          return;
        }
        
        if (data) {
          setProfileData({
            name: data.nome || '',
            email: user.email || '',
            phone: data.telefone || '(11) 99999-9999',
            avatar: data.avatar || ''
          });
          if (data.avatar) {
            setAvatarPreview(data.avatar);
          }
        }
      } catch (err) {
        console.error('[CONFIG] Erro ao carregar perfil:', err);
        setProfileData({ name: '', email: user.email || '', phone: '(11) 99999-9999', avatar: '' });
      }

      try {
        const stored = localStorage.getItem('axium_notifications');
        if (stored) {
          setNotifications(JSON.parse(stored));
        }
      } catch {}
    };
    loadData();
  }, [user?.id]);

  const generateInviteLink = () => {
    if (!inviteEmail) {
      setInviteError('Digite o e-mail do membro');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError('Digite um e-mail válido');
      return;
    }
    const token = btoa(`${inviteEmail}-${Date.now()}-${inviteRole}`);
    const link = `${window.location.origin}/signup?invite=${token}&email=${encodeURIComponent(inviteEmail)}&role=${inviteRole}`;
    setInviteLink(link);
    setInviteError('');
    setInviteSuccess('Link gerado com sucesso!');
    setTimeout(() => setInviteSuccess(''), 3000);
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CONFIG] handleSaveProfile iniciado', { userId: user?.id, name: profileData.name });
    
    if (!user?.id) {
      setProfileError('Usuário não autenticado');
      console.error('[CONFIG] Erro: usuário não autenticado');
      return;
    }
    if (!profileData.name.trim()) {
      setProfileError('Nome não pode ser vazio');
      console.error('[CONFIG] Erro: nome vazio');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (profileData.email && profileData.email.trim() && !emailRegex.test(profileData.email.trim())) {
      setProfileError('Email profissional inválido');
      console.error('[CONFIG] Erro: email inválido');
      return;
    }
    
    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    
    try {
      console.log('[CONFIG] Tentando salvar no Supabase...');
      
      const updateData: Record<string, unknown> = { 
        nome: profileData.name.trim(),
        telefone: profileData.phone.trim()
      };
      
      if (avatarPreview && avatarPreview !== profileData.avatar) {
        updateData.avatar = avatarPreview;
      }
      
      console.log('[CONFIG] Dados a salvar:', updateData);
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();
      
      console.log('[CONFIG] Resposta do Supabase:', { data, error });
      
      if (error) {
        console.error('[CONFIG] Erro do Supabase:', error);
        throw error;
      }
      
      console.log('[CONFIG] Perfil salvo com sucesso!');
      setProfileSuccess('Perfil atualizado com sucesso!');
      setProfileData(prev => ({ ...prev, avatar: avatarPreview || prev.avatar, email: profileData.email.trim() || prev.email }));
      setTimeout(() => {
        console.log('[CONFIG] Fechando modal...');
        setProfileSuccess('');
        setActiveModal(null);
      }, 1500);
    } catch (err: any) {
      console.error('[CONFIG] Erro ao salvar perfil:', err);
      const errorMessage = err.message || 'Erro ao salvar perfil. Tente novamente.';
      setProfileError(errorMessage);
    } finally {
      console.log('[CONFIG] Finalizando, isSavingProfile:', false);
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setProfileError('Apenas PNG ou JPG são aceitos');
      return;
    }
    
    setIsUploadingAvatar(true);
    setProfileError('');
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      setAvatarPreview(publicUrl);
      setProfileSuccess('Avatar atualizado! Clique em Salvar para confirmar.');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      console.error('[CONFIG] Erro ao fazer upload:', err);
      setProfileError('Erro ao fazer upload. Tente novamente.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (!passwordData.current) {
      setPasswordError('Digite a senha atual');
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError('Digite a nova senha');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirm) {
      setPasswordError('As senhas não conferem');
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.current
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Senha atual incorreta');
        }
        throw error;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (updateError) throw updateError;
      
      setPasswordSuccess('Senha alterada com sucesso!');
      setPasswordData({ current: '', newPassword: '', confirm: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      console.error('[CONFIG] Erro ao alterar senha:', err);
      setPasswordError(err.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifications(true);
    setNotificationsError('');
    setNotificationsSuccess('');
    try {
      localStorage.setItem('axium_notifications', JSON.stringify(notifications));
      setNotificationsSuccess('Notificações salvas com sucesso!');
      setTimeout(() => setNotificationsSuccess(''), 3000);
    } catch (err: any) {
      console.error('[CONFIG] Erro ao salvar notificações:', err);
      setNotificationsError('Erro ao salvar preferências');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmail(true);
    setEmailError('');
    setEmailSuccess('');
    try {
      if (!smtpData.server || !smtpData.port || !smtpData.user) {
        setEmailError('Preencha servidor, porta e usuário');
        setIsSavingEmail(false);
        return;
      }
      localStorage.setItem('axium_smtp_config', JSON.stringify(smtpData));
      setEmailSuccess('Configurações de email salvas!');
      setTimeout(() => setEmailSuccess(''), 3000);
    } catch (err: any) {
      console.error('[CONFIG] Erro ao salvar email:', err);
      setEmailError('Erro ao salvar configurações');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setThemeError('');
    setThemeSuccess('');
    try {
      localStorage.setItem('axium_theme_mode', theme);
      localStorage.setItem('axium_accent_color', accentColor);
      if (user?.id) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            theme_mode: theme,
            accent_color: accentColor,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (error) {
          console.warn('[CONFIG] Erro ao salvar no banco, usando localStorage:', error.message);
        }
      }
      setThemeSuccess('Tema aplicado com sucesso!');
      setTimeout(() => {
        setThemeSuccess('');
        setActiveModal(null);
      }, 1500);
    } catch (err: any) {
      console.error('[CONFIG] Erro ao salvar tema:', err);
      setThemeError('Erro ao salvar tema. Tente novamente.');
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
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

  const toggleNotification = (type: NotificationType) => {
    setNotifications(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const sections = [
    { id: 'perfil' as ModalType, icon: User, title: 'Perfil', description: 'Gerencie nome, email e foto de perfil', items: ['Nome', 'Email', 'Foto de perfil'] },
    { id: 'seguranca' as ModalType, icon: Lock, title: 'Segurança', description: 'Altere a senha e configure autenticação', items: ['Alterar senha', 'Autenticação 2FA', 'Sessões ativas'] },
    { id: 'notificacoes' as ModalType, icon: Bell, title: 'Notificações', description: 'Configure alertas por email, push ou SMS', items: ['Email', 'Push', 'SMS'] },
    { id: 'tema' as ModalType, icon: Palette, title: 'Tema', description: 'Personalizar aparência da interface', items: ['Dark Mode', 'Light Mode', 'Auto'] },
    { id: 'email' as ModalType, icon: Mail, title: 'Email', description: 'SMTP, assinatura e templates de email', items: ['SMTP', 'Assinatura', 'Templates'] },
    { id: 'equipe' as ModalType, icon: Users, title: 'Equipe', description: 'Convidar membros e gerenciar acessos', items: ['Convidar', 'Permissões', 'Membros'] },
  ];

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

      {activeModal && activeModal !== 'delete' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-neutral-200 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500">
            {activeModal === 'perfil' ? (
              <form onSubmit={handleSaveProfile}>
                <div className="px-12 py-10 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/30">
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[3px] mb-3 block">Preferências do Sistema</span>
                    <h2 className="text-4xl font-black text-black tracking-tighter">Configurações de Perfil</h2>
                  </div>
                  <button type="button" onClick={() => { setActiveModal(null); setProfileError(''); setProfileSuccess(''); }} className="p-3 hover:bg-white rounded-2xl transition-colors text-neutral-300 hover:text-black border border-transparent hover:border-neutral-200 shadow-sm">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {profileError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                      <AlertCircle size={20} />
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-medium">
                      <CheckCircle2 size={20} />
                      {profileSuccess}
                    </div>
                  )}
                  <div className="space-y-8">
                    <div className="flex items-center gap-8 mb-4">
                      <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center relative group/avatar cursor-pointer overflow-hidden" onClick={() => avatarInputRef.current?.click()}>
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle size={48} className="text-white" />
                        )}
                        <div className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest text-center px-2">
                          {isUploadingAvatar ? 'Enviando...' : 'Alterar Foto'}
                        </div>
                        <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleAvatarUpload} className="hidden" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-black text-black text-lg">Avatar do Administrador</h4>
                        <p className="text-xs text-neutral-400 font-medium">Clique para fazer upload de um novo arquivo PNG ou JPG.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" placeholder="Seu nome completo" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Email Profissional</label>
                        <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" placeholder="seu@email.com" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-12 py-10 bg-neutral-50 flex gap-4">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">Cancelar</button>
                  <button type="submit" disabled={isSavingProfile} className="flex-[2] text-white py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:brightness-90 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3" style={{ backgroundColor: 'var(--primary)' }}>
                    {isSavingProfile ? <><RefreshCw size={18} className="animate-spin" /> Salvando...</> : <><Save size={18} /> Salvar Perfil</>}
                  </button>
                </div>
              </form>
            ) : activeModal === 'seguranca' ? (
              <form onSubmit={handleChangePassword}>
                <div className="px-12 py-10 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/30">
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[3px] mb-3 block">Preferências do Sistema</span>
                    <h2 className="text-4xl font-black text-black tracking-tighter">Segurança da Conta</h2>
                  </div>
                  <button type="button" onClick={() => { setActiveModal(null); setPasswordError(''); setPasswordSuccess(''); }} className="p-3 hover:bg-white rounded-2xl transition-colors text-neutral-300 hover:text-black border border-transparent hover:border-neutral-200 shadow-sm">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {passwordError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                      <AlertCircle size={20} />
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-medium">
                      <CheckCircle2 size={20} />
                      {passwordSuccess}
                    </div>
                  )}
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
                          <input type={showPassword ? "text" : "password"} value={passwordData.current} onChange={(e) => setPasswordData({...passwordData, current: e.target.value})} placeholder="••••••••" className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-black">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Nova Senha</label>
                          <div className="relative">
                            <input type={showNewPassword ? "text" : "password"} value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} placeholder="Mínimo 8 caracteres" className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-black">{showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                          <input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} placeholder="Repita a nova senha" className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-12 py-10 bg-neutral-50 flex gap-4">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">Cancelar</button>
                  <button type="submit" disabled={isSavingPassword} className="flex-[2] text-white py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:brightness-90 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3" style={{ backgroundColor: 'var(--primary)' }}>
                    {isSavingPassword ? <><RefreshCw size={18} className="animate-spin" /> Alterando...</> : <><Key size={18} /> Alterar Senha</>}
                  </button>
                </div>
              </form>
            ) : activeModal === 'notificacoes' ? (
              <form onSubmit={handleSaveNotifications}>
                <div className="px-12 py-10 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/30">
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[3px] mb-3 block">Preferências do Sistema</span>
                    <h2 className="text-4xl font-black text-black tracking-tighter">Alertas & Avisos</h2>
                  </div>
                  <button type="button" onClick={() => { setActiveModal(null); setNotificationsError(''); setNotificationsSuccess(''); }} className="p-3 hover:bg-white rounded-2xl transition-colors text-neutral-300 hover:text-black border border-transparent hover:border-neutral-200 shadow-sm">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {notificationsError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                      <AlertCircle size={20} />
                      {notificationsError}
                    </div>
                  )}
                  {notificationsSuccess && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-medium">
                      <CheckCircle2 size={20} />
                      {notificationsSuccess}
                    </div>
                  )}
                  <div className="space-y-6">
                    <div onClick={() => toggleNotification('email')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${notifications.email ? 'border-black bg-black/5' : 'border-neutral-100 hover:border-neutral-200'}`}>
                      <div className="flex items-center gap-4">
                        <Mail size={24} className={notifications.email ? 'text-black' : 'text-neutral-300'} />
                        <div>
                          <p className="font-black text-black">Notificações por Email</p>
                          <p className="text-xs text-neutral-400 font-medium">Receba alertas sobre novos leads e tarefas</p>
                        </div>
                      </div>
                      <div className={`w-14 h-8 rounded-full transition-all flex items-center ${notifications.email ? 'bg-black justify-end' : 'bg-neutral-200 justify-start'}`}>
                        <div className="w-6 h-6 bg-white rounded-full m-1" />
                      </div>
                    </div>
                    <div onClick={() => toggleNotification('push')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${notifications.push ? 'border-black bg-black/5' : 'border-neutral-100 hover:border-neutral-200'}`}>
                      <div className="flex items-center gap-4">
                        <Smartphone size={24} className={notifications.push ? 'text-black' : 'text-neutral-300'} />
                        <div>
                          <p className="font-black text-black">Notificações Push</p>
                          <p className="text-xs text-neutral-400 font-medium">Receba alertas no navegador</p>
                        </div>
                      </div>
                      <div className={`w-14 h-8 rounded-full transition-all flex items-center ${notifications.push ? 'bg-black justify-end' : 'bg-neutral-200 justify-start'}`}>
                        <div className="w-6 h-6 bg-white rounded-full m-1" />
                      </div>
                    </div>
                    <div onClick={() => toggleNotification('sms')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${notifications.sms ? 'border-black bg-black/5' : 'border-neutral-100 hover:border-neutral-200'}`}>
                      <div className="flex items-center gap-4">
                        <Globe size={24} className={notifications.sms ? 'text-black' : 'text-neutral-300'} />
                        <div>
                          <p className="font-black text-black">Notificações SMS</p>
                          <p className="text-xs text-neutral-400 font-medium">Receba alertas por SMS (em breve)</p>
                        </div>
                      </div>
                      <div className={`w-14 h-8 rounded-full transition-all flex items-center ${notifications.sms ? 'bg-black justify-end' : 'bg-neutral-200 justify-start'}`}>
                        <div className="w-6 h-6 bg-white rounded-full m-1" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-12 py-10 bg-neutral-50 flex gap-4">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">Cancelar</button>
                  <button type="submit" disabled={isSavingNotifications} className="flex-[2] text-white py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:brightness-90 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3" style={{ backgroundColor: 'var(--primary)' }}>
                    {isSavingNotifications ? <><RefreshCw size={18} className="animate-spin" /> Salvando...</> : <><Save size={18} /> Salvar Preferências</>}
                  </button>
                </div>
              </form>
            ) : activeModal === 'tema' ? (
              <form onSubmit={handleSaveTheme}>
                <div className="px-12 py-10 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/30">
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[3px] mb-3 block">Preferências do Sistema</span>
                    <h2 className="text-4xl font-black text-black tracking-tighter">Personalizar Tema</h2>
                  </div>
                  <button type="button" onClick={() => { setActiveModal(null); setThemeError(''); setThemeSuccess(''); }} className="p-3 hover:bg-white rounded-2xl transition-colors text-neutral-300 hover:text-black border border-transparent hover:border-neutral-200 shadow-sm">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {themeError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                      <AlertCircle size={20} />
                      {themeError}
                    </div>
                  )}
                  {themeSuccess && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-medium">
                      <CheckCircle2 size={20} />
                      {themeSuccess}
                    </div>
                  )}
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
                <div className="px-12 py-10 bg-neutral-50">
                  <button type="submit" className="w-full text-white py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:brightness-90 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3" style={{ backgroundColor: 'var(--primary)' }}>
                    <CheckCircleIcon size={18} /> Tema Aplicado
                  </button>
                </div>
              </form>
            ) : activeModal === 'email' ? (
              <form onSubmit={handleSaveEmail}>
                <div className="px-12 py-10 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/30">
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[3px] mb-3 block">Preferências do Sistema</span>
                    <h2 className="text-4xl font-black text-black tracking-tighter">Integração de Email</h2>
                  </div>
                  <button type="button" onClick={() => { setActiveModal(null); setEmailError(''); setEmailSuccess(''); }} className="p-3 hover:bg-white rounded-2xl transition-colors text-neutral-300 hover:text-black border border-transparent hover:border-neutral-200 shadow-sm">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {emailError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                      <AlertCircle size={20} />
                      {emailError}
                    </div>
                  )}
                  {emailSuccess && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-medium">
                      <CheckCircle2 size={20} />
                      {emailSuccess}
                    </div>
                  )}
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
                      <button type="button" onClick={handleTestConnection} disabled={isTestingConnection} className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all ${testResult === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : testResult === 'error' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-neutral-100 text-neutral-400 hover:bg-black hover:text-white'}`}>
                        {isTestingConnection ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                        {testResult === 'success' ? 'Conexão Estabelecida!' : testResult === 'error' ? 'Falha na Conexão' : 'Testar Conexão SMTP'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-12 py-10 bg-neutral-50 flex gap-4">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">Cancelar</button>
                  <button type="submit" disabled={isSavingEmail} className="flex-[2] text-white py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:brightness-90 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3" style={{ backgroundColor: 'var(--primary)' }}>
                    {isSavingEmail ? <><RefreshCw size={18} className="animate-spin" /> Salvando...</> : <><Save size={18} /> Salvar Integração</>}
                  </button>
                </div>
              </form>
            ) : activeModal === 'equipe' ? (
              <div>
                <div className="px-12 py-10 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/30">
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[3px] mb-3 block">Preferências do Sistema</span>
                    <h2 className="text-4xl font-black text-black tracking-tighter">Equipe</h2>
                  </div>
                  <button type="button" onClick={() => { setActiveModal(null); setInviteError(''); setInviteSuccess(''); }} className="p-3 hover:bg-white rounded-2xl transition-colors text-neutral-300 hover:text-black border border-transparent hover:border-neutral-200 shadow-sm">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {inviteError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                      <AlertCircle size={20} />
                      {inviteError}
                    </div>
                  )}
                  {inviteSuccess && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-medium">
                      <CheckCircle2 size={20} />
                      {inviteSuccess}
                    </div>
                  )}
                  <div className="space-y-8">
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-4">
                      <Users className="text-blue-500" size={32} />
                      <div>
                        <p className="text-sm font-black text-blue-900">Convide sua Equipe</p>
                        <p className="text-xs text-blue-600 font-medium">Gere um link de convite para adicionar novos membros.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">E-mail do Membro</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                          <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colega@email.com" className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl pl-12 pr-6 py-4 font-bold text-black focus:border-black outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Cargo</label>
                        <div className="flex gap-3">
                          <button type="button" onClick={() => setInviteRole('Funcionario')} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${inviteRole === 'Funcionario' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}>Funcionário</button>
                          <button type="button" onClick={() => setInviteRole('Socio')} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${inviteRole === 'Socio' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}>Sócio</button>
                        </div>
                      </div>
                      <button type="button" onClick={generateInviteLink} className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-2">
                        <LinkIcon size={16} /> Gerar Link de Convite
                      </button>
                      {inviteLink && (
                        <div className="space-y-3 pt-4 border-t border-neutral-100">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Link Gerado</label>
                          <div className="flex gap-2">
                            <input type="text" value={inviteLink} readOnly className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-medium text-neutral-600 truncate" />
                            <button type="button" onClick={copyInviteLink} className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-neutral-800'}`}>
                              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                              {copied ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                          <p className="text-xs text-neutral-400 font-medium">Compartilhe este link com seu colega. Ele será redirecionado para criar uma conta com acesso automático.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-12 py-10 bg-neutral-50">
                  <button type="button" onClick={() => setActiveModal(null)} className="w-full py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">Fechar</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

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