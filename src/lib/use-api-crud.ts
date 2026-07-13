import { useState, useEffect, useCallback, useRef } from 'react';
import { api, ApiError } from './api';

export type SyncStatus = 'loading' | 'synced' | 'error' | 'offline';

interface CrudState<T> {
  data: T[];
  status: SyncStatus;
  error: string | null;
}

const POLL_INTERVAL = 30000;

export function useApiCrud<T extends { id: string }>(
  endpoint: string,
  { polling = true }: { polling?: boolean } = {},
) {
  const [state, setState] = useState<CrudState<T>>({
    data: [],
    status: 'loading',
    error: null,
  });

  const mountedRef = useRef(true);
  const dataRef = useRef<T[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [endpoint]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      if (mountedRef.current) fetchAll();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [endpoint, polling]);

  async function fetchAll() {
    try {
      const data = await api.get<T[]>(endpoint);
      if (mountedRef.current) {
        dataRef.current = data;
        setState(prev => {
          if (JSON.stringify(prev.data) === JSON.stringify(data)) return prev;
          return { data, status: 'synced', error: null };
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: err instanceof ApiError ? err.message : 'Erro ao carregar dados',
        }));
      }
    }
  }

  const add = useCallback(async (item: Omit<T, 'id'>): Promise<string> => {
    const created = await api.post<T>(endpoint, item);
    if (mountedRef.current) {
      setState(prev => ({ ...prev, data: [...prev.data, created] }));
    }
    return (created as { id: string }).id;
  }, [endpoint]);

  const update = useCallback(async (id: string, fields: Partial<T>) => {
    const updated = await api.put<T>(`${endpoint}/${id}`, fields);
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        data: prev.data.map(item => item.id === id ? updated : item),
      }));
    }
  }, [endpoint]);

  const remove = useCallback(async (id: string) => {
    await api.delete(`${endpoint}/${id}`);
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== id),
      }));
    }
  }, [endpoint]);

  const revalidate = useCallback(() => {
    fetchAll();
  }, []);

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    add,
    update,
    remove,
    revalidate,
  };
}
