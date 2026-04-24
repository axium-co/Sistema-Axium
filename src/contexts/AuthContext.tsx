import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase, PROFILES_TABLE } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

interface SignUpData {
  nome: string;
  sobrenome: string;
  email: string;
  password: string;
  cargo?: 'Socio' | 'Funcionario';
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchUserProfile = async (userId: string): Promise<{ nome?: string } | null> => {
  try {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('nome')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === '404' || error.message?.includes('not found') || error.message?.includes('no rows')) {
        console.warn('Profiles table not found or empty, using fallback');
        return { nome: 'Usuário' };
      }
      console.warn('Profile fetch error:', error.message);
      return { nome: 'Usuário' };
    }
    return data || { nome: 'Usuário' };
  } catch (err) {
    console.warn('Profile fetch exception:', err);
    return { nome: 'Usuário' };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser({ id: session.user.id, email: session.user.email || '', fullName: profile?.nome });
        setIsAuthenticated(true);
      }
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser({ id: session.user.id, email: session.user.email || '', fullName: profile?.nome });
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      });

      setIsLoading(false);
      return () => subscription.unsubscribe();
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[AUTH] Tentativa de login:', { email: normalizedEmail, hasPassword: !!password });
    
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    
    if (error) {
      console.error('[AUTH] Erro no login:', error.message);
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid credentials')) {
        throw new Error('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
      }
      throw new Error(error.message);
    }
    
    if (data.user) {
      console.log('[AUTH] Login bem-sucedido:', { userId: data.user.id, email: data.user.email });
      const profile = await fetchUserProfile(data.user.id);
      setUser({ id: data.user.id, email: data.user.email || '', fullName: profile?.nome });
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const signup = async ({ nome, sobrenome, email, password, cargo }: SignUpData) => {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[AUTH] Tentativa de cadastro:', { email: normalizedEmail, hasPassword: !!password });
    
    const { data, error } = await supabase.auth.signUp({ 
      email: normalizedEmail, 
      password,
      options: {
        data: {
          nome,
          sobrenome,
        }
      }
    });
    
    if (error) {
      console.error('[AUTH] Erro no cadastro:', error.message);
      if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
        throw new Error('Este e-mail já está cadastrado. Por favor, faça login.');
      }
      throw new Error(error.message);
    }
    
    if (data.user) {
      console.log('[AUTH] Cadastro bem-sucedido:', { userId: data.user.id, email: normalizedEmail });
      const fullName = `${nome} ${sobrenome}`.trim();
      const userCargo = cargo || 'Funcionario';
      
      await supabase
        .from(PROFILES_TABLE)
        .insert({
          user_id: data.user.id,
          nome: fullName,
          cargo: userCargo,
        })
        .then(({ error: profileError }) => {
          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
          }
        });
      
      setUser({ id: data.user.id, email: data.user.email || '', fullName });
      setIsAuthenticated(true);
    }
  };

  const resetPassword = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('[AUTH] Solicitação de reset de senha:', { email: normalizedEmail });
    
    const redirectTo = `${window.location.origin}/update-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });
    
    if (error) {
      console.error('[AUTH] Erro ao solicitar reset:', error.message);
      
      if (error.message.includes('Email rate limit exceeded') || error.message.includes('rate limit')) {
        throw new Error('Muitas tentativas. Por favor, aguarde alguns minutos e tente novamente.');
      }
      
      if (error.message.includes('No eligible') || error.message.includes('not found') || error.message.includes('User not found')) {
        throw new Error('E-mail não encontrado. Verifique se o e-mail está correto ou crie uma nova conta.');
      }
      
      if (error.message.includes('Email provider') || error.message.includes('smtp')) {
        throw new Error('Serviço de recuperação temporariamente indisponível. Por favor, contacte o administrador do sistema.');
      }
      
      throw new Error(error.message);
    }
    
    if (data) {
      console.log('[AUTH] Reset email enviado:', data);
    }
  };

  const updatePassword = async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUser({ id: data.user.id, email: data.user.email || '', fullName: profile?.nome });
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, signup, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};