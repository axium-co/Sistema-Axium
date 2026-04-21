import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { supabase, PROFILES_TABLE, ACTIVITY_LOGS_TABLE, type Profile, type ActivityLog } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProfilesContextType {
  profile: Profile | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>>) => Promise<void>;
}

const ProfilesContext = createContext<ProfilesContextType | undefined>(undefined);

export const ProfilesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from(PROFILES_TABLE)
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
  }, [user]);

  const updateProfile = async (data: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) return;
    await supabase
      .from(PROFILES_TABLE)
      .update(data)
      .eq('user_id', user.id);
    await fetchProfile();
  };

  return (
    <ProfilesContext.Provider value={{ profile, fetchProfile, updateProfile }}>
      {children}
    </ProfilesContext.Provider>
  );
};

export const useProfiles = () => {
  const context = useContext(ProfilesContext);
  if (!context) throw new Error('useProfiles must be used within ProfilesProvider');
  return context;
};

interface ActivityLogsContextType {
  activityLogs: ActivityLog[];
  fetchActivityLogs: (limit?: number) => Promise<void>;
  logActivity: (acao: ActivityLog['acao'], descricao: string) => Promise<void>;
}

const ActivityLogsContext = createContext<ActivityLogsContextType | undefined>(undefined);

export const ActivityLogsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const fetchActivityLogs = useCallback(async (limit = 20) => {
    const { data } = await supabase
      .from(ACTIVITY_LOGS_TABLE)
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    setActivityLogs(data || []);
  }, []);

  const logActivity = async (acao: ActivityLog['acao'], descricao: string) => {
    if (!user) return;
    const { data } = await supabase
      .from(ACTIVITY_LOGS_TABLE)
      .insert({ user_id: user.id, acao, descricao, timestamp: new Date().toISOString() })
      .select()
      .single();
    if (data) {
      setActivityLogs(prev => [data, ...prev]);
    }
  };

  return (
    <ActivityLogsContext.Provider value={{ activityLogs, fetchActivityLogs, logActivity }}>
      {children}
    </ActivityLogsContext.Provider>
  );
};

export const useActivityLogs = () => {
  const context = useContext(ActivityLogsContext);
  if (!context) throw new Error('useActivityLogs must be used within ActivityLogsProvider');
  return context;
};