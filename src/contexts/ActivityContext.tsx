import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';
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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [fetchActivityLogsError, setFetchActivityLogsError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ActivityLog[]>('/activity-logs')
      .then((logs) => {
        setActivityLogs(logs);
        setIsLoadingLogs(false);
        setFetchActivityLogsError(null);
      })
      .catch((err) => {
        console.error('[ActivityLogs] Erro ao carregar:', err);
        setFetchActivityLogsError('Erro ao carregar atividades.');
        setIsLoadingLogs(false);
      });
  }, []);

  const logActivity = useCallback(async (acao: ActivityLog['acao'], descricao: string) => {
    try {
      await api.post('/activity-logs', { acao, descricao });
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
