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
    
    if (error || !data) {
      return null;
    }
    return data;
  } catch {
    return null;
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (data.user) {
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
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          nome,
          sobrenome,
        }
      }
    });
    
    if (error) {
      if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
        throw new Error('Este e-mail já está cadastrado. Por favor, faça login.');
      }
      throw new Error(error.message);
    }
    
    if (data.user) {
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
    const redirectTo = `${window.location.origin}/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    
    if (error) {
      throw new Error(error.message);
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