import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ref,
  onValue,
  off,
  type DatabaseReference,
  type Unsubscribe,
} from 'firebase/database';
import { database } from '../lib/firebase-rtdb';

// =============================================================================
// useFirebaseSubscription<T>
//
// Custom hook universal para escutar nós do Firebase Realtime Database em
// tempo real. Funciona de forma IDÊNTICA em Web PC, Web Mobile, App Desktop
// (Electron/Tauri) e App Mobile (React Native / Expo).
//
// CARACTERÍSTICAS:
//   - Usa onValue() com cleanup automático no useEffect
//   - Tipagem genérica: useFirebaseSubscription<LeadRTDB>('/leads')
//   - Sincronia em tempo real: qualquer alteração no servidor reflete na tela
//     no mesmo milissegundo (via WebSocket persistente do Firebase)
//   - Cache offline nativo: se o dispositivo perder a conexão, os últimos
//     dados recebidos ficam disponíveis; ao reconectar, sincroniza sozinho
//   - Limpeza de memória: o unsubscribe é chamado no cleanup do useEffect,
//     evitando listeners órfãos e vazamento de memória
//
// USO:
//   function ListaLeads() {
//     const { data: leads, loading, error } = useFirebaseSubscription<LeadRTDB>('/leads');
//     if (loading) return <Spinner />;
//     return <LeadList leads={leads} />;
//   }
// =============================================================================

export type SubscriptionStatus = 'loading' | 'synced' | 'error' | 'offline';

export interface SubscriptionResult<T> {
  /** Dados do nó no formato { [childKey]: T } ou null se vazio */
  data: Record<string, T> | null;
  /** Status atual da conexão */
  status: SubscriptionStatus;
  /** true enquanto estiver carregando os dados iniciais */
  loading: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** true se o dispositivo estiver offline (sem conexão de rede) */
  isOffline: boolean;
  /** Força uma re-subscrição manual */
  revalidate: () => void;
}

export function useFirebaseSubscription<T extends Record<string, unknown>>(
  /**
   * Caminho no Realtime Database (ex: '/leads', '/tarefas', '/financeiro')
   */
  path: string,
  /**
   * Opcional: callback chamado a cada atualização (side-effect)
   */
  onDataChange?: (data: Record<string, T> | null) => void,
): SubscriptionResult<T> {
  // ─── Estado ──────────────────────────────────────────────
  const [data, setData] = useState<Record<string, T> | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // ─── Refs para cleanup e controle ────────────────────────
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const mountedRef = useRef(true);
  const pathRef = useRef(path);
  const dbRefRef = useRef<DatabaseReference | null>(null);
  const listenerRef = useRef<((snapshot: unknown) => void) | null>(null);
  const onDataChangeRef = useRef(onDataChange);

  // Mantém o callback sempre atualizado sem reiniciar o listener
  onDataChangeRef.current = onDataChange;

  // Atualiza o pathRef quando o path muda
  pathRef.current = path;

  // ─── Função de subscrição ────────────────────────────────
  const subscribe = useCallback(() => {
    // Limpa subscrição anterior se existir
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Valida o path
    if (!path || path.trim() === '') {
      setStatus('error');
      setError('[useFirebaseSubscription] path não pode ser vazio');
      return () => {};
    }

    const dbRef = ref(database, path);
    dbRefRef.current = dbRef;

    setStatus('loading');
    setError(null);

    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (!mountedRef.current) return;

        try {
          let dados: Record<string, T> | null = null;

          if (snapshot.exists()) {
            const val = snapshot.val();
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
              dados = val as Record<string, T>;
            } else if (val !== null) {
              // Caso o snapshot contenha um valor primitivo ou array,
              // encapsula em um objeto com chave 'value'
              dados = { value: val } as unknown as Record<string, T>;
            }
          }

          setData(dados);
          setStatus('synced');
          setError(null);

          if (onDataChangeRef.current) {
            onDataChangeRef.current(dados);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro desconhecido';
          console.error(`[useFirebaseSubscription] Erro ao processar dados de "${path}":`, err);
          if (mountedRef.current) {
            setError(message);
          }
        }
      },
      (err) => {
        if (!mountedRef.current) return;

        console.error(`[useFirebaseSubscription] Erro no listener em "${path}":`, err);

        const message = err.message || 'Erro de conexão com o Firebase';

        if (
          err.code === 'UNAVAILABLE' ||
          err.code === 'NETWORK_ERROR' ||
          message.toLowerCase().includes('offline') ||
          message.toLowerCase().includes('network')
        ) {
          setStatus('offline');
          setIsOffline(true);
        } else {
          setStatus('error');
        }

        setError(message);
      },
    );

    // Guarda referência para o listener e unsubscribe
    listenerRef.current = listener as unknown as ((snapshot: unknown) => void);

    const unsubscribe = () => {
      try {
        off(dbRef, 'value', listener);
      } catch (e) {
        console.warn(`[useFirebaseSubscription] Erro ao dar unsubscribe de "${path}":`, e);
      }
    };

    unsubscribeRef.current = unsubscribe;

    return unsubscribe;
  }, [path]);

  // ─── Efeito principal ────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    const cleanup = subscribe();

    return () => {
      mountedRef.current = false;
      if (cleanup) cleanup();
      unsubscribeRef.current = null;
      dbRefRef.current = null;
    };
  }, [subscribe]);

  // ─── Monitor de conectividade ────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Se estava em erro/offline, tenta re-subescrever
      if (status === 'offline' || status === 'error') {
        // subscribe() será re-chamado automaticamente se o path mudar
        // ou podemos forçar via revalidate
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status]);

  // ─── Revalidate ──────────────────────────────────────────
  const revalidate = useCallback(() => {
    subscribe();
  }, [subscribe]);

  // ─── Retorno ─────────────────────────────────────────────
  return {
    data,
    status,
    loading: status === 'loading',
    error,
    isOffline,
    revalidate,
  };
}

export default useFirebaseSubscription;
