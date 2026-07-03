import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { loginApi, ApiError, setAuthToken } from '../lib/api';

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMPLOYEES = ['Maria', 'João', 'Pedro', 'Ana'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);

  const hasPermission = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return allowedRoles.includes(user.role);
  }, [isAuthenticated, user]);

  useEffect(() => {
    setIsLoading(false);
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
    if (!EMPLOYEES.includes(name)) return;

    setEmployeeName(name);
    setUser(prev => prev ? { ...prev, name } : null);
  };

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
        availableEmployees: EMPLOYEES,
        hasPermission,
        login,
        selectEmployee,
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
