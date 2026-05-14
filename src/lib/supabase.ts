import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = !!rawUrl && !!rawKey;

if (!isConfigured) {
  console.warn(
    '[Supabase] Variáveis de ambiente VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não configuradas.',
    '\n  O sistema continuará funcionando com localStorage como fallback.',
    '\n  Para conectar ao Supabase, configure as variáveis no arquivo .env:',
    '\n  VITE_SUPABASE_URL=https://seu-projeto.supabase.co',
    '\n  VITE_SUPABASE_ANON_KEY=sua-chave-anonima'
  );
}

const supabaseUrl = rawUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'axium-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

type TableChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface TableChangePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}

export function subscribeToTable<T>(
  table: string,
  event: TableChangeEvent,
  callback: (payload: TableChangePayload<T>) => void,
  filter?: string,
): RealtimeChannel | null {
  if (!isConfigured) return null;

  const channelName = `realtime:${table}:${event}:${filter ?? 'all'}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelConfig: Record<string, any> = {
    event,
    schema: 'public',
    table,
  };

  if (filter) {
    channelConfig.filter = filter;
  }

  return supabase
    .channel(channelName)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('postgres_changes', channelConfig, (payload: any) => {
      callback({
        eventType: payload.eventType as TableChangePayload['eventType'],
        new: payload.new as T,
        old: payload.old as T,
      });
    })
    .subscribe();
}

export { isConfigured as isSupabaseConfigured };

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  cargo: 'Socio' | 'Funcionario';
  avatar: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  acao: 'lead_criado' | 'lead_movido' | 'tarefa_concluida' | 'lead_atualizado';
  descricao: string;
  timestamp: string;
}

export const PROFILES_TABLE = 'profiles';
export const ACTIVITY_LOGS_TABLE = 'activity_logs';
