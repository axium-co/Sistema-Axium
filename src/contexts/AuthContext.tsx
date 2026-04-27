import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type UserRole = 'admin' | 'employee' | null;

interface AuthUser {
  id: string;
  role: UserRole;
  employeeName?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  role: UserRole;
  employeeName: string | null;
  availableEmployees: string[];
  login: (role: UserRole, password: string) => Promise<void>;
  selectEmployee: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMPLOYEES = ['Maria', 'João', 'Pedro', 'Ana'];

const ADMIN_PASSWORD = 'admin123';
const EMPLOYEE_PASSWORD = 'func123';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('axium_auth');
    if (stored) {
      try {
        const authData = JSON.parse(stored);
        if (authData.role && authData.employeeName) {
          setRole(authData.role);
          setEmployeeName(authData.employeeName);
          setUser({
            id: authData.role === 'admin' ? 'admin-id' : 'employee-id',
            role: authData.role,
            employeeName: authData.employeeName
          });
          setIsAuthenticated(true);
        }
      } catch {
        // Invalid data
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (loginRole: UserRole, password: string) => {
    if (!loginRole) {
      throw new Error('Selecione o tipo de acesso');
    }

    const correctPassword = loginRole === 'admin' ? ADMIN_PASSWORD : EMPLOYEE_PASSWORD;
    
    if (password !== correctPassword) {
      if (loginRole === 'admin') {
        throw new Error('Senha de admin incorreta');
      }
      throw new Error('Senha de funcionário incorreta');
    }

    const name = loginRole === 'admin' ? 'Administrador' : EMPLOYEES[0];
    
    setRole(loginRole);
    setEmployeeName(name);
    setUser({ id: loginRole === 'admin' ? 'admin-id' : 'employee-id', role: loginRole, employeeName: name });
    setIsAuthenticated(true);

    localStorage.setItem('axium_auth', JSON.stringify({
      role: loginRole,
      employeeName: name
    }));
  };

  const selectEmployee = (name: string) => {
    if (!EMPLOYEES.includes(name)) return;
    
    setEmployeeName(name);
    setUser(prev => prev ? { ...prev, employeeName: name } : null);

    const currentRole = role;
    if (currentRole) {
      localStorage.setItem('axium_auth', JSON.stringify({
        role: currentRole,
        employeeName: name
      }));
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setEmployeeName(null);
    setIsAuthenticated(false);
    localStorage.removeItem('axium_auth');
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