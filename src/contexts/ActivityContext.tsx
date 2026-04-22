import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { supabase, ACTIVITY_LOGS_TABLE, type ActivityLog } from '../lib/supabase';

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

  const fetchActivityLogs = useCallback(async (limit = 20) => {
    setIsLoadingLogs(true);
    setFetchActivityLogsError(null);
    
    const timeoutId = setTimeout(() => {
      setFetchActivityLogsError('Tempo limite excedido (5s). Verifique sua conexão.');
      setIsLoadingLogs(false);
    }, 5000);

    try {
      const { data, error } = await supabase
        .from(ACTIVITY_LOGS_TABLE)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Erro ao buscar logs de atividade:', error);
        setFetchActivityLogsError('Erro ao carregar atividades. Verifique sua conexão.');
        return;
      }
      setActivityLogs(data || []);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Erro ao buscar logs de atividade:', err);
      setFetchActivityLogsError('Erro ao carregar atividades. Verifique sua conexão.');
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const logActivity = async (acao: ActivityLog['acao'], descricao: string) => {
    const { data } = await supabase
      .from(ACTIVITY_LOGS_TABLE)
      .insert({ acao, descricao, timestamp: new Date().toISOString() })
      .select()
      .single();
    if (data) {
      setActivityLogs(prev => [data, ...prev]);
    }
  };

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