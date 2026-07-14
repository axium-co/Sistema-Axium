import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { loginApi, ApiError, setAuthToken, getMe, api, setOnAuthError } from '../lib/api';

type UserRole = 'admin' | 'manager' | 'user';
export type { UserRole };

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthUser extends User {
  createdAt?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  employeeName: string | null;
  availableEmployees: string[];
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  selectEmployee: (name: string) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [employees, setEmployees] = useState<string[]>([]);

  const hasPermission = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return allowedRoles.includes(user.role);
  }, [isAuthenticated, user]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (!e.newValue) {
          setUser(null);
          setRole(null);
          setEmployeeName(null);
          setIsAuthenticated(false);
        } else {
          setAuthToken(e.newValue);
          getMe().then(res => {
            const authUser: AuthUser = {
              id: res.user.id,
              email: res.user.email,
              name: res.user.name,
              role: res.user.role as UserRole,
              createdAt: res.user.createdAt,
            };
            setUser(authUser);
            setRole(authUser.role);
            setEmployeeName(authUser.name);
            setIsAuthenticated(true);
          }).catch(() => {});
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    setOnAuthError(() => {
      setUser(null);
      setRole(null);
      setEmployeeName(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    });

    async function init() {
      abortRef.current = new AbortController();

      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        setAuthToken(savedToken);
        try {
          const res = await getMe();
          const authUser: AuthUser = {
            id: res.user.id,
            email: res.user.email,
            name: res.user.name,
            role: res.user.role as UserRole,
            createdAt: res.user.createdAt,
          };
          setUser(authUser);
          setRole(authUser.role);
          setEmployeeName(authUser.name);
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem('auth_token');
          setAuthToken(null);
        }
      }

      try {
        const emps = await api.get<{ id: string; name: string }[]>('/employees');
        setEmployees(emps.map(e => e.name));
      } catch {
        console.warn('[Auth] Não foi possível carregar funcionários da API');
      }

      setIsLoading(false);
    }
    init();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function clearAuth() {
    setUser(null);
    setRole(null);
    setEmployeeName(null);
    setIsAuthenticated(false);
    setAuthToken(null);
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const result = await loginApi(normalizedEmail, password);
        const authUser: AuthUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role as UserRole,
          createdAt: result.user.createdAt,
        };
        setUser(authUser);
        setRole(authUser.role);
        setEmployeeName(authUser.name);
        setIsAuthenticated(true);
        setAuthToken(result.token);

        return { success: true };
      } catch (apiErr: unknown) {
        console.error('[AUTH] API login error:', apiErr);
        if (apiErr instanceof ApiError) {
          return { success: false, error: apiErr.message };
        }
        if (apiErr instanceof TypeError) {
          return { success: false, error: 'Servidor indisponível. Verifique se o backend está rodando.' };
        }
        return { success: false, error: 'E-mail ou senha incorretos' };
      }
    } catch (err) {
      console.error('[AUTH] Login error (inesperado):', err);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const selectEmployee = (name: string) => {
    if (!employees.includes(name)) return;

    setEmployeeName(name);
    setUser(prev => prev ? { ...prev, name } : null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();
      const authUser: AuthUser = {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        role: res.user.role as UserRole,
        createdAt: res.user.createdAt,
      };
      setUser(authUser);
      setRole(authUser.role);
      setEmployeeName(authUser.name);
    } catch {
      console.error('[Auth] Erro ao atualizar dados do usuário');
    }
  }, []);

  const logout = async () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        role,
        employeeName,
        availableEmployees: employees,
        hasPermission,
        login,
        selectEmployee,
        refreshUser,
        logout,
      }}
    >
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

export const usePermission = (allowedRoles: UserRole[]) => {
  const { hasPermission, isAuthenticated } = useAuth();
  return isAuthenticated && hasPermission(allowedRoles);
};
