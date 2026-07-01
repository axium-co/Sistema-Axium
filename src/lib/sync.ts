import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  type QueryConstraint,
  type FirestoreError,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { generateUUID } from './uuid';

export type SyncStatus = 'loading' | 'synced' | 'error' | 'offline' | 'migrating';

interface SyncState<T> {
  data: T[];
  status: SyncStatus;
  error: string | null;
}

type LocalStorageKey = string;

export function useCollectionSync<T extends { id: string }>(
  collectionName: string,
  storageKey: LocalStorageKey,
  constraints: QueryConstraint[] = [],
  userId?: string | null,
) {
  const initialState = (): SyncState<T> => {
    const stored = loadFromStorage<T[]>(storageKey);
    if (!isFirebaseConfigured) {
      return { data: stored || [], status: 'offline', error: null };
    }
    return { data: stored || [], status: 'loading', error: null };
  };

  const [state, setState] = useState<SyncState<T>>(initialState);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const connectedRef = useRef(true);

  const buildQuery = useCallback(() => {
    const baseQuery = userId
      ? query(
          collection(db, collectionName),
          where('userId', '==', userId),
          ...constraints,
        )
      : query(
          collection(db, collectionName),
          ...constraints,
        );
    return baseQuery;
  }, [collectionName, constraints, userId]);

  const subscribe = useCallback(() => {
    if (!isFirebaseConfigured) {
      const stored = loadFromStorage<T[]>(storageKey);
      setState({ data: stored || [], status: 'offline', error: null });
      return () => {};
    }

    const q = buildQuery();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!mountedRef.current) return;

        const docs = snapshot.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data } as T;
        });

        setState({
          data: docs,
          status: 'synced',
          error: null,
        });

        if (docs.length > 0) {
          saveToStorage(storageKey, docs);
        }
      },
      (err: FirestoreError) => {
        if (!mountedRef.current) return;

        console.error(`[Sync] Erro no listener ${collectionName}:`, {
          code: err.code,
          message: err.message,
          name: err.name,
        });

        if (err.code === 'permission-denied') {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: 'Permissão negada. Verifique as regras do Firestore.',
          }));
        } else if (err.code === 'unavailable' || err.code === 'failed-precondition') {
          connectedRef.current = false;
          setState((prev) => ({
            ...prev,
            status: 'offline',
            error: 'Serviço indisponível. Verifique sua conexão.',
          }));
        } else {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: err.message,
          }));
        }
      },
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [buildQuery, collectionName, storageKey]);

  useEffect(() => {
    const cleanup = subscribe();
    return () => {
      cleanup();
    };
  }, [subscribe]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const add = useCallback(
    async (item: Omit<T, 'id'>): Promise<string> => {
      if (!isFirebaseConfigured) {
        return addToLocal(item);
      }

      try {
        const docRef = await addDoc(collection(db, collectionName), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: userId || null,
        });
        console.log(`[Sync] Documento adicionado em ${collectionName}: ${docRef.id}`);
        return docRef.id;
      } catch (err) {
        const error = err as FirestoreError;
        console.error(`[Sync] Erro ao adicionar em ${collectionName}:`, {
          code: error.code,
          message: error.message,
          collection: collectionName,
        });
        throw err;
      }
    },
    [collectionName, userId],
  );

  function addToLocal(item: Omit<T, 'id'>): string {
    const stored = loadFromStorage<T[]>(storageKey) || [];
    const newId = generateUUID();
    const newItem = { ...item, id: newId } as unknown as T;
    saveToStorage(storageKey, [...stored, newItem]);
    setState((prev) => ({ ...prev, data: [...prev.data, newItem] }));
    return newId;
  }

  const update = useCallback(
    async (id: string, fields: Partial<T>) => {
      if (!isFirebaseConfigured) {
        updateLocal(id, fields);
        return;
      }

      try {
        await updateDoc(doc(db, collectionName, id), {
          ...fields,
          updatedAt: serverTimestamp(),
        });
        console.log(`[Sync] Documento atualizado em ${collectionName}: ${id}`);
      } catch (err) {
        const error = err as FirestoreError;
        console.error(`[Sync] Erro ao atualizar ${id} em ${collectionName}:`, {
          code: error.code,
          message: error.message,
          collection: collectionName,
          documentId: id,
        });
        throw err;
      }
    },
    [collectionName],
  );

  function updateLocal(id: string, fields: Partial<T>) {
    const stored = loadFromStorage<T[]>(storageKey) || [];
    const updated = stored.map((item) =>
      item.id === id ? { ...item, ...fields } : item,
    );
    saveToStorage(storageKey, updated);
    setState((prev) => ({
      ...prev,
      data: prev.data.map((item) =>
        item.id === id ? { ...item, ...fields } : item,
      ),
    }));
  }

  const remove = useCallback(
    async (id: string) => {
      if (!isFirebaseConfigured) {
        removeLocal(id);
        return;
      }

      try {
        await deleteDoc(doc(db, collectionName, id));
        console.log(`[Sync] Documento removido de ${collectionName}: ${id}`);
      } catch (err) {
        const error = err as FirestoreError;
        console.error(`[Sync] Erro ao remover ${id} de ${collectionName}:`, {
          code: error.code,
          message: error.message,
          collection: collectionName,
          documentId: id,
        });
        throw err;
      }
    },
    [collectionName],
  );

  function removeLocal(id: string) {
    const stored = loadFromStorage<T[]>(storageKey) || [];
    saveToStorage(
      storageKey,
      stored.filter((item) => item.id !== id),
    );
    setState((prev) => ({
      ...prev,
      data: prev.data.filter((item) => item.id !== id),
    }));
  }

  const revalidate = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      subscribe();
    }
  }, [subscribe]);

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

function loadFromStorage<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

function saveToStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Sync] Erro ao salvar no localStorage:', e);
  }
}
