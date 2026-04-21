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
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchUserProfile = async (userId: string): Promise<string | undefined> => {
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select('nome')
    .eq('user_id', userId)
    .single();
  
  if (!error && data) {
    return data.nome;
  }
  return undefined;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const fullName = await fetchUserProfile(session.user.id);
        setUser({ id: session.user.id, email: session.user.email || '', fullName });
        setIsAuthenticated(true);
      }
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const fullName = await fetchUserProfile(session.user.id);
          setUser({ id: session.user.id, email: session.user.email || '', fullName });
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
      const fullName = await fetchUserProfile(data.user.id);
      setUser({ id: data.user.id, email: data.user.email || '', fullName });
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const signup = async ({ nome, sobrenome, email, password }: SignUpData) => {
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
      throw new Error(error.message);
    }
    
    if (data.user) {
      const fullName = `${nome} ${sobrenome}`.trim();
      
      const { error: profileError } = await supabase
        .from(PROFILES_TABLE)
        .insert({
          user_id: data.user.id,
          nome: fullName,
          cargo: 'Funcionario',
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }
      
      setUser({ id: data.user.id, email: data.user.email || '', fullName });
      setIsAuthenticated(true);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, signup }}>
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