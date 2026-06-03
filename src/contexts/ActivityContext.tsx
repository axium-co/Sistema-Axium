import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { db, ACTIVITY_LOGS_COLLECTION, isFirebaseConfigured, type ActivityLog } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, onSnapshot } from 'firebase/firestore';

interface ActivityLogsContextType {
  activityLogs: ActivityLog[];
  isLoadingLogs: boolean;
  fetchActivityLogsError: string | null;
  fetchActivityLogs: (limit?: number) => Promise<void>;
  logActivity: (acao: ActivityLog['acao'], descricao: string) => Promise<void>;
}

const ActivityLogsContext = createContext<ActivityLogsContextType | undefined>(undefined);

const defaultActivityLogsContext: ActivityLogsContextType = {
  activityLogs: [],
  isLoadingLogs: false,
  fetchActivityLogsError: null,
  fetchActivityLogs: async () => {},
  logActivity: async () => {},
};

export const ActivityLogsProvider = ({ children }: { children: ReactNode }) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [fetchActivityLogsError, setFetchActivityLogsError] = useState<string | null>(null);

  const fetchActivityLogs = useCallback(async (limitCount = 20) => {
    if (!isFirebaseConfigured) {
      setActivityLogs([]);
      setIsLoadingLogs(false);
      return;
    }

    setIsLoadingLogs(true);
    setFetchActivityLogsError(null);

    const timeoutId = setTimeout(() => {
      setFetchActivityLogsError('Tempo limite excedido (5s). Verifique sua conexão.');
      setIsLoadingLogs(false);
    }, 5000);

    try {
      const q = query(
        collection(db, ACTIVITY_LOGS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount),
      );
      const querySnapshot = await getDocs(q);

      clearTimeout(timeoutId);

      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityLog[];

      setActivityLogs(logs);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Erro ao buscar logs de atividade:', err);
      if (err instanceof Error && err.message?.includes('fetch')) {
        setFetchActivityLogsError('Erro de conexão. Verifique sua internet.');
      } else {
        setFetchActivityLogsError('Erro ao carregar atividades. Tente novamente.');
      }
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const logActivity = async (acao: ActivityLog['acao'], descricao: string) => {
    if (!isFirebaseConfigured) return;

    try {
      const docRef = await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), {
        acao,
        descricao,
        timestamp: new Date().toISOString(),
      });

      const newLog: ActivityLog = {
        id: docRef.id,
        user_id: '',
        acao,
        descricao,
        timestamp: new Date().toISOString(),
      };
      setActivityLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error('Erro ao registrar atividade:', err);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(20),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityLog[];
      setActivityLogs(logs);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ActivityLogsContext.Provider value={{ activityLogs, isLoadingLogs, fetchActivityLogsError, fetchActivityLogs, logActivity }}>
      {children}
    </ActivityLogsContext.Provider>
  );
};

export const useActivityLogs = () => {
  const context = useContext(ActivityLogsContext);
  return context || defaultActivityLogsContext;
};
