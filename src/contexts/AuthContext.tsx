import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { generateUUID, isValidUUID } from '../lib/uuid';

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
  firebaseUid?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  employeeName: string | null;
  availableEmployees: string[];
  firebaseUser: FirebaseUser | null;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  selectEmployee: (name: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'auth_user';
const EMPLOYEES = ['Maria', 'João', 'Pedro', 'Ana'];

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const CREDENTIALS: Record<string, { password: string; role: UserRole; name: string }> = {};
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  CREDENTIALS[ADMIN_EMAIL] = {
    password: ADMIN_PASSWORD,
    role: 'admin',
    name: 'Administrador',
  };
}

async function fetchUserFromFirestore(firebaseUser: FirebaseUser): Promise<{ role: UserRole; name: string } | null> {
  try {
    const docRef = doc(db, 'user_roles', firebaseUser.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        role: data.role || 'user',
        name: data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
      };
    }
    const email = firebaseUser.email?.toLowerCase() || '';
    if (email === ADMIN_EMAIL) {
      const roleData = { role: 'admin' as UserRole, name: 'Administrador' };
      await setDoc(docRef, {
        email,
        role: roleData.role,
        name: roleData.name,
        createdAt: serverTimestamp(),
      });
      return roleData;
    }
    return null;
  } catch (err) {
    console.error('[AUTH] Error fetching Firestore user:', err);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const hasPermission = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return allowedRoles.includes(user.role);
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      loadLocalAuth();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        const roleData = await fetchUserFromFirestore(firebaseUser);
        if (roleData) {
          const authUser: AuthUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: roleData.name,
            role: roleData.role,
            createdAt: firebaseUser.metadata.creationTime || undefined,
            firebaseUid: firebaseUser.uid,
          };
          setUser(authUser);
          setRole(roleData.role);
          setEmployeeName(roleData.name);
          setIsAuthenticated(true);
        } else {
          await firebaseSignOut(auth);
          clearAuth();
        }
      } else {
        setFirebaseUser(null);
        const localUser = loadLocalAuth();
        if (!localUser) {
          clearAuth();
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadLocalAuth(): AuthUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        if (authData?.email && authData?.id) {
          if (!isValidUUID(authData.id) && authData.id.length < 20) {
            authData.id = generateUUID();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
          }
          const userRole: UserRole = authData.role || 'user';
          const loadedUser: AuthUser = {
            id: authData.id,
            email: authData.email,
            name: authData.name || 'Usuário',
            role: userRole,
            createdAt: authData.createdAt,
          };
          setUser(loadedUser);
          setRole(userRole);
          setEmployeeName(authData.name || authData.employeeName || 'Usuário');
          setIsAuthenticated(true);
          setIsLoading(false);
          return loadedUser;
        }
      }
    } catch (err) {
      console.error('[AUTH] Error loading stored auth:', err);
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
    return null;
  }

  function clearAuth() {
    setUser(null);
    setRole(null);
    setEmployeeName(null);
    setFirebaseUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isFirebaseConfigured) {
        try {
          await signInWithEmailAndPassword(auth, normalizedEmail, password);
          return { success: true };
        } catch (fbErr: any) {
          const code = fbErr.code;
          if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            return { success: false, error: 'E-mail ou senha incorretos' };
          }
          console.error('[AUTH] Firebase login error:', fbErr);
          return { success: false, error: 'Erro ao conectar com servidor. Verifique sua internet.' };
        }
      }

      const credential = CREDENTIALS[normalizedEmail];
      if (!credential || credential.password !== password.trim()) {
        return { success: false, error: 'E-mail ou senha incorretos' };
      }

      const authUser: AuthUser = {
        id: generateUUID(),
        email: normalizedEmail,
        name: credential.name,
        role: credential.role,
        createdAt: new Date().toISOString(),
      };

      setUser(authUser);
      setRole(credential.role);
      setEmployeeName(credential.name);
      setIsAuthenticated(true);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
        employeeName: authUser.name,
        createdAt: authUser.createdAt,
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
    setUser(prev => prev ? { ...prev, name } : null);

    if (role) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: user?.id,
        email: user?.email,
        name,
        role,
        employeeName: name,
      }));
    }
  };

  const logout = async () => {
    try {
      if (isFirebaseConfigured && firebaseUser) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.error('[AUTH] Firebase signOut error:', err);
    }
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
        firebaseUser,
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