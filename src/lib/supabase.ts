import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PLACEHOLDER_URL = 'https://your-project.supabase.co';
const PLACEHOLDER_KEY = 'your-anon-key';

const isConfigured =
  !!rawUrl &&
  !!rawKey &&
  rawUrl !== PLACEHOLDER_URL &&
  rawKey !== PLACEHOLDER_KEY;

if (!isConfigured) {
  console.warn(
    '[Supabase] Variáveis de ambiente VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não configuradas.',
    '\n  O sistema continuará funcionando com localStorage como fallback.',
    '\n  Para conectar ao Supabase, configure as variáveis no arquivo .env:',
    '\n  VITE_SUPABASE_URL=https://seu-projeto.supabase.co',
    '\n  VITE_SUPABASE_ANON_KEY=sua-chave-anonima'
  );
}

const supabaseUrl = rawUrl || PLACEHOLDER_URL;
const supabaseAnonKey = rawKey || PLACEHOLDER_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'axium-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
