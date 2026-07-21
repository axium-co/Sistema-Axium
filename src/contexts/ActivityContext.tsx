import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import type { ActivityLog } from '../types/activity';

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
  const { isAuthenticated } = useAuth();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [fetchActivityLogsError, setFetchActivityLogsError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingLogs(false);
      return;
    }
    mountedRef.current = true;
    api.get<ActivityLog[]>('/activity-logs')
      .then((logs) => {
        if (mountedRef.current) {
          setActivityLogs(logs);
          setIsLoadingLogs(false);
          setFetchActivityLogsError(null);
        }
      })
      .catch((err) => {
        console.error('[ActivityLogs] Erro ao carregar:', err);
        if (mountedRef.current) {
          setFetchActivityLogsError('Erro ao carregar atividades.');
          setIsLoadingLogs(false);
        }
      });
    return () => { mountedRef.current = false; };
  }, [isAuthenticated]);

  const logActivity = useCallback(async (acao: ActivityLog['acao'], descricao: string) => {
    try {
      const created = await api.post<ActivityLog>('/activity-logs', { acao, descricao });
      setActivityLogs(prev => [created, ...prev]);
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
