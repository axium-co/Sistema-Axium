import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { db, ACTIVITY_LOGS_COLLECTION, isFirebaseConfigured, type ActivityLog } from '../lib/firebase';
import { collection, query, orderBy, limit, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface ActivityLogsContextType {
  activityLogs: ActivityLog[];
  isLoadingLogs: boolean;
  fetchActivityLogsError: string | null;
  logActivity: (acao: ActivityLog['acao'], descricao: string) => Promise<void>;
}

const ActivityLogsContext = createContext<ActivityLogsContextType | undefined>(undefined);

const defaultActivityLogsContext: ActivityLogsContextType = {
  activityLogs: [],
  isLoadingLogs: false,
  fetchActivityLogsError: null,
  logActivity: async () => {},
};

export const ActivityLogsProvider = ({ children }: { children: ReactNode }) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [fetchActivityLogsError, setFetchActivityLogsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoadingLogs(false);
      return;
    }

    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(20),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ActivityLog[];
        setActivityLogs(logs);
        setIsLoadingLogs(false);
        setFetchActivityLogsError(null);
      },
      (err) => {
        console.error('[ActivityLogs] Erro no listener:', err.code, err.message);
        setFetchActivityLogsError('Erro ao carregar atividades em tempo real. Verifique sua conexão.');
        setIsLoadingLogs(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const logActivity = useCallback(async (acao: ActivityLog['acao'], descricao: string) => {
    if (!isFirebaseConfigured) return;

    try {
      await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), {
        acao,
        descricao,
        user_id: '',
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      console.log(`[ActivityLogs] Atividade registrada: ${acao} - ${descricao}`);
    } catch (err) {
      console.error('[ActivityLogs] Erro ao registrar atividade:', err);
    }
  }, []);

  return (
    <ActivityLogsContext.Provider value={{ activityLogs, isLoadingLogs, fetchActivityLogsError, logActivity }}>
      {children}
    </ActivityLogsContext.Provider>
  );
};

export const useActivityLogs = () => {
  const context = useContext(ActivityLogsContext);
  return context || defaultActivityLogsContext;
};
