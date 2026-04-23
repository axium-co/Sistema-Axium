import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, User, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onLogin?: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, resetPassword } = useAuth();
  
  // Check for invite params in URL
  const inviteEmail = searchParams.get('email');
  const inviteRole = searchParams.get('role');
  const inviteToken = searchParams.get('invite');
  
  const [isSignUp, setIsSignUp] = useState(!!inviteEmail); // If invite present, show signup
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState(inviteEmail || 'axium.contato@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');

  // Pre-fill signup mode if invited
  useEffect(() => {
    if (inviteEmail && inviteRole) {
      setIsSignUp(true);
    }
  }, [inviteEmail, inviteRole]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
try {
      setError('');
      setSuccess('');
      setIsLoading(true);
      
      const normalizedEmail = email.trim().toLowerCase();
      
      if (isSignUp) {
        if (!nome || !sobrenome || !email || !password) {
          setError('Por favor, preencha todos os campos.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setIsLoading(false);
          return;
        }
        await signup({ nome, sobrenome, email: normalizedEmail, password, cargo: inviteRole as 'Socio' | 'Funcionario' });
        setSuccess('Conta criada com sucesso!');
        if (onLogin) onLogin();
        navigate('/crm/painel');
      } else {
        if (email && password) {
          const normalizedEmail = email.trim().toLowerCase();
          await login(normalizedEmail, password);
          if (onLogin) onLogin();
          navigate('/crm/painel');
        } else {
          setError('Por favor, preencha todos os campos.');
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      console.error('[LOGIN] Erro:', err?.message || err);
      const errorMessage = err?.message || '';
      
      if (isSignUp) {
        if (errorMessage.includes('already registered') || errorMessage.includes('cadastrado')) {
          setError('Este e-mail já está cadastrado. Por favor, faça login.');
        } else if (errorMessage.includes('valid email')) {
          setError('Por favor, insira um e-mail válido.');
        } else {
          setError('Erro ao criar conta. Verifique os dados e tente novamente.');
        }
      } else {
        if (errorMessage.includes('incorrect') || errorMessage.includes('inválidas') || errorMessage.includes('incorrect')) {
          setError('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
        } else if (errorMessage.includes('valid email')) {
          setError('Por favor, insira um e-mail válido.');
        } else {
          setError('Erro ao fazer login. Verifique suas credenciais e tente novamente.');
        }
      }
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
  };

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (!email) {
        setError('Por favor, digite seu e-mail.');
        setIsLoading(false);
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      console.log('[LOGIN] Tentando recuperar senha para:', normalizedEmail);
      await resetPassword(normalizedEmail);
      setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada (e spam).');
      setTimeout(() => setShowForgotPassword(false), 5000);
    } catch (err: any) {
      console.error('[LOGIN] Erro ao recuperar senha:', err?.message || err);
      
      const errorMsg = err?.message || '';
      
      if (errorMsg.includes('não encontrado') || errorMsg.includes('not found')) {
        setError('E-mail não encontrado. Verifique o endereço informado.');
      } else if (errorMsg.includes('muitas tentativas') || errorMsg.includes('rate limit')) {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else if (errorMsg.includes('indisponível')) {
        setError('Serviço temporariamente indisponível. Tente novamente mais tarde.');
      } else {
        setError('Erro ao enviar e-mail. Verifique o endereço e tente novamente.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12">
        <img src="/logo.png" alt="Universo Axium" className="h-10 w-auto object-contain filter brightness-0 invert" />
        <div>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Acelerando<br />o Crescimento.
          </h1>
          <p className="text-neutral-400 text-lg font-medium">
            Sistema de gestão interno para resultados extraordinários.
          </p>
        </div>
        <p className="text-neutral-600 text-sm">© 2026 Universo Axium · v1.0.0</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 md:mb-10 text-center">
            <img src="/logo.png" alt="Universo Axium" className="h-8 md:h-10 w-auto mx-auto object-contain" />
          </div>

          <div className="mb-6 md:mb-8">
            {isSignUp ? (
              <>
                <h2 className="text-xl md:text-2xl font-black text-black tracking-tight mb-1">Criar Conta</h2>
                <p className="text-neutral-500 text-xs md:text-sm">Preencha seus dados para se cadastrar.</p>
              </>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-black text-black tracking-tight mb-1">Bem-vindo de volta</h2>
                <p className="text-neutral-500 text-xs md:text-sm">Faça login para acessar o painel.</p>
              </>
            )}
          </div>

          {(error || success) && (
            <div className={`mb-4 md:mb-6 p-2 md:p-3.5 ${success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} rounded-md`}>
              <p className={`${success ? 'text-green-600' : 'text-red-600'} text-xs md:text-sm font-medium`}>{success || error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
            {isSignUp && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="nome" className="block text-[10px] md:text-xs font-bold text-neutral-600 uppercase tracking-wider">
                    Nome
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      id="nome"
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full border border-neutral-200 rounded-md py-2 md:py-3 pl-10 md:pl-11 pr-4 text-black text-xs md:text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sobrenome" className="block text-[10px] md:text-xs font-bold text-neutral-600 uppercase tracking-wider">
                    Sobrenome
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      id="sobrenome"
                      type="text"
                      value={sobrenome}
                      onChange={(e) => setSobrenome(e.target.value)}
                      placeholder="Seu sobrenome"
                      className="w-full border border-neutral-200 rounded-md py-2 md:py-3 pl-10 md:pl-11 pr-4 text-black text-xs md:text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] md:text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full border border-neutral-200 rounded-md py-2 md:py-3 pl-10 md:pl-11 pr-4 text-black text-xs md:text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[10px] md:text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="password" className="w-full border border-neutral-200 rounded-md py-2 md:py-3 pl-10 md:pl-11 pr-11 md:pr-4 text-black text-xs md:text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full border border-neutral-200 rounded-md py-3 pl-11 pr-12 text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded-sm border-neutral-300 accent-black cursor-pointer" disabled={isLoading} />
                <span className="text-neutral-500 font-medium">Lembrar sessão</span>
              </label>
              <button type="button" onClick={() => setShowForgotPassword(true)} className="text-black font-semibold hover:underline">Esqueci a senha</button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {isSignUp ? 'Criando conta...' : 'Entrando...'}</>
              ) : (
                isSignUp ? 'Criar conta' : 'Entrar no sistema'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-400 mt-8">
            {isSignUp ? (
              <>
                Já tem uma conta?{' '}
                <button onClick={toggleMode} className="text-black font-bold hover:underline bg-none border-none cursor-pointer">Entre aqui</button>
              </>
            ) : (
              <>
                Não tem uma conta?{' '}
                <button onClick={toggleMode} className="text-black font-bold hover:underline bg-none border-none cursor-pointer">Criar conta</button>
              </>
            )}
          </p>
        </div>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForgotPassword(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h3 className="text-base font-black text-black">Recuperar Senha</h3>
              <button onClick={() => setShowForgotPassword(false)} className="p-1 text-neutral-400 hover:text-black transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
              {(error || success) && (
                <div className={`p-3 rounded-md ${success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm font-medium ${success ? 'text-green-600' : 'text-red-600'}`}>{success || error}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border border-neutral-200 rounded-md py-3 pl-10 pr-4 text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-500">Enviaremos um link para você redefinir sua senha.</p>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  'Enviar link'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
