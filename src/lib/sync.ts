import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
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
): {
  data: T[];
  status: SyncStatus;
  error: string | null;
  add: (item: Omit<T, 'id'>) => Promise<string>;
  update: (id: string, fields: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  revalidate: () => void;
} {
  const [state, setState] = useState<SyncState<T>>(() => {
    const stored = loadFromStorage<T[]>(storageKey);
    if (!isFirebaseConfigured) {
      return { data: stored, status: 'offline', error: null };
    }
    return { data: stored, status: 'loading', error: null };
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const hasSubscribed = useRef(false);
  const localDataMigrated = useRef(false);

  const userIdStr = userId ?? '__anonymous__';

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

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const stored = loadFromStorage<T[]>(storageKey);
      setState({ data: stored, status: 'offline', error: null });
      return;
    }

    if (hasSubscribed.current) return;

    const localItems = loadFromStorage<T[]>(storageKey);
    const q = buildQuery();

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (!snapshot.metadata.hasPendingWrites) {
          const docs = snapshot.docs.map((d) => {
            const data = d.data();
            return { id: d.id, ...data } as T;
          });

          if (docs.length === 0 && localItems.length > 0 && !localDataMigrated.current) {
            localDataMigrated.current = true;
            setState((prev) => ({ ...prev, status: 'migrating' }));

            try {
              const BATCH_LIMIT = 500;
              for (let i = 0; i < localItems.length; i += BATCH_LIMIT) {
                const batch = writeBatch(db);
                const chunk = localItems.slice(i, i + BATCH_LIMIT);
                chunk.forEach((item) => {
                  const ref = doc(db, collectionName, item.id);
                  batch.set(ref, {
                    ...item,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    userId: userId || null,
                  });
                });
                await batch.commit();
              }
              console.log(`[Sync] Migrated ${localItems.length} items to ${collectionName}`);
            } catch (err) {
              console.error(`[Sync] Migration error for ${collectionName}:`, err);
              localDataMigrated.current = false;
            }
            return;
          }

          setState({ data: docs, status: 'synced', error: null });
          saveToStorage(storageKey, docs);
          hasSubscribed.current = true;
        }
      },
      (err: FirestoreError) => {
        console.error(`[Sync] Error on ${collectionName}:`, err.message);
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: err.message,
        }));
      },
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
      hasSubscribed.current = false;
      localDataMigrated.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, storageKey, userIdStr]);

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
        return docRef.id;
      } catch (err) {
        console.error(`[Sync] Error adding to ${collectionName}, falling back to localStorage:`, err);
        return addToLocal(item);
      }
    },
    [collectionName, storageKey, userId],
  );

  function addToLocal(item: Omit<T, 'id'>): string {
    const stored = loadFromStorage<T[]>(storageKey);
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
      } catch (err) {
        console.error(`[Sync] Error updating ${id} in ${collectionName}, falling back to localStorage:`, err);
        updateLocal(id, fields);
      }
    },
    [collectionName, storageKey],
  );

  function updateLocal(id: string, fields: Partial<T>) {
    const stored = loadFromStorage<T[]>(storageKey);
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
      } catch (err) {
        console.error(`[Sync] Error removing ${id} from ${collectionName}, falling back to localStorage:`, err);
        removeLocal(id);
      }
    },
    [collectionName, storageKey],
  );

  function removeLocal(id: string) {
    const stored = loadFromStorage<T[]>(storageKey);
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
      hasSubscribed.current = false;
      localDataMigrated.current = false;
    }
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

function loadFromStorage<T>(key: string): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [] as unknown as T;
    return JSON.parse(stored);
  } catch {
    return [] as unknown as T;
  }
}

function saveToStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Sync] Error saving to localStorage:', e);
  }
}
