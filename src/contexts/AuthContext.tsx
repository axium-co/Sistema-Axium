import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type UserRole = 'admin' | 'employee';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeName?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  employeeName: string | null;
  availableEmployees: string[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  selectEmployee: (name: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'auth_user';

const EMPLOYEES = ['Maria', 'João', 'Pedro', 'Ana'];

const VALID_CREDENTIALS = {
  email: 'axium.contato@gmail.com',
  password: 'axium@26'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);

  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const authData = JSON.parse(stored);
          if (authData?.email && authData?.id) {
            const userRole = authData.role || 'admin';
            setUser({
              id: authData.id,
              email: authData.email,
              role: userRole,
              employeeName: authData.employeeName || 'Administrador'
            });
            setRole(userRole);
            setEmployeeName(authData.employeeName || 'Administrador');
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('[AUTH] Error loading stored auth:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
      setIsLoading(false);
    };
    loadStoredAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      if (normalizedEmail !== VALID_CREDENTIALS.email || normalizedPassword !== VALID_CREDENTIALS.password) {
        return { success: false, error: 'E-mail ou senha incorretos' };
      }

      const userRole: UserRole = 'admin';
      const name = 'Administrador';
      
      const authUser: AuthUser = {
        id: 'admin-user-id',
        email: normalizedEmail,
        role: userRole,
        employeeName: name
      };

      setUser(authUser);
      setRole(userRole);
      setEmployeeName(name);
      setIsAuthenticated(true);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        employeeName: authUser.employeeName
      }));

      return { success: true };
    } catch (err) {
      console.error('[AUTH] Login error:', err);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const selectEmployee = (name: string) => {
    if (!EMPLOYEES.includes(name)) return;
    
    setEmployeeName(name);
    setUser(prev => prev ? { ...prev, employeeName: name } : null);

    const currentRole = role;
    if (currentRole) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: user?.id,
        email: user?.email,
        role: currentRole,
        employeeName: name
      }));
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setRole(null);
      setEmployeeName(null);
      setIsAuthenticated(false);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('[AUTH] Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      role,
      employeeName,
      availableEmployees: EMPLOYEES,
      login,
      selectEmployee,
      logout
    }}>
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