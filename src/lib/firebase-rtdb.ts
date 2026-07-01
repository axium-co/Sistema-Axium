import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  keepSynced,
  set,
  update,
  push,
  remove,
  onValue,
  off,
  get,
  ServerValue,
  type DatabaseReference,
  type Unsubscribe,
} from 'firebase/database';

// =============================================================================
// CONFIGURAÇÃO CENTRALIZADA FIREBASE RTDB  (v10+)
// Aplicável em: Web PC, Web Mobile, App Desktop (Electron/Tauri),
// App Mobile (React Native / Expo via react-native-firebase)
// =============================================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAdTYc8gSrO05T5QeFVB2m1NxgOpUpwko8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sistemaaxium.firebaseapp.com',
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://sistemaaxium-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sistemaaxium',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sistemaaxium.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '69845074869',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:69845074869:web:08c397278f5739bd4e8ffc',
};

// ─── Singleton: evita "Firebase App named '[DEFAULT]' already exists" ─────────
function obterAppFirebase(): FirebaseApp {
  if (getApps().length === 0) {
    console.log('[FirebaseRTDB] Inicializando Firebase app...');
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

const app = obterAppFirebase();
const database = getDatabase(app);

// =============================================================================
// CACHE OFFLINE NATIVO + KEEPSYNC
// O Realtime Database mantém cache local automaticamente sempre que um
// listener (onValue) estiver ativo. Para forçar a sincronia contínua mesmo
// sem listeners ativos, usamos keepSynced() nos nós críticos.
// =============================================================================

/** Nós do sistema que exigem sincronia offline absoluta */
export const NOS_CRITICOS = ['/leads', '/tarefas', '/financeiro'] as const;

/**
 * Ativa keepSynced nos nós críticos (leads, tarefas, financeiro).
 * Deve ser chamada UMA vez na inicialização da aplicação (ex: App.tsx).
 *
 * O keepSynced força o SDK a manter uma conexão com o servidor e baixar
 * todos os dados do nó para o cache local. Se o dispositivo ficar offline,
 * os dados continuam disponíveis localmente. Ao reconectar, o Firebase
 * sincroniza automaticamente as mudanças que ocorreram enquanto estava offline.
 */
export function ativarCacheOffline(): void {
  if (typeof window === 'undefined') return; // SSR / servidor

  for (const node of NOS_CRITICOS) {
    try {
      keepSynced(ref(database, node), true);
    } catch (err) {
      console.error(`[FirebaseRTDB] Erro ao ativar keepSynced em ${node}:`, err);
    }
  }
}

// =============================================================================
// HELPERS DE REFERÊNCIA
// =============================================================================

function nodeRef(path: string): DatabaseReference {
  return ref(database, path);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// =============================================================================
// TIPOS COMPARTILHADOS (Leads, Tarefas, Financeiro)
// =============================================================================

export interface LeadRTDB {
  nome: string;
  telefone: string;
  email?: string;
  instagram?: string;
  origem?: string;
  estagio: string;
  valor?: number;
  observacoes?: string;
  criadoEm: typeof ServerValue.TIMESTAMP;
  atualizadoEm: typeof ServerValue.TIMESTAMP;
  criadoPor?: string;
  ultimoModificadoPor?: string;
}

export interface TarefaRTDB {
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  responsavel?: string;
  leadId?: string;
  prazo?: number;
  criadoEm: typeof ServerValue.TIMESTAMP;
  atualizadoEm: typeof ServerValue.TIMESTAMP;
}

export interface FinanceiroRTDB {
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  categoria?: string;
  dataVencimento?: number;
  dataPagamento?: number;
  status: 'pendente' | 'pago' | 'cancelado';
  parcelado?: boolean;
  qtdeParcelas?: number;
  criadoEm: typeof ServerValue.TIMESTAMP;
  atualizadoEm: typeof ServerValue.TIMESTAMP;
}

// =============================================================================
// FUNÇÕES DE SALVAMENTO COM TIMESTAMP DO SERVIDOR
//
// ServerValue.TIMESTAMP é um placeholder que o Firebase substitui pelo
// timestamp Unix exato (em milissegundos) do servidor no momento da
// gravação. Isso garante que, mesmo que dois dispositivos escrevam quase
// ao mesmo tempo, a ordenação será feita pelo relógio do servidor e não
// pelo relógio local de cada aparelho, evitando conflitos de concorrência.
// =============================================================================

/**
 * Adiciona um novo registro com ID automático (push).
 * O criadoEm e atualizadoEm são definidos com ServerValue.TIMESTAMP.
 * Retorna a chave única gerada pelo Firebase.
 */
export function adicionarComTimestamp<T extends Record<string, unknown>>(
  path: string,
  dados: T,
): Promise<string> {
  const novaRef = push(nodeRef(path));
  const dadosComTimestamp = {
    ...dados,
    criadoEm: ServerValue.TIMESTAMP,
    atualizadoEm: ServerValue.TIMESTAMP,
  } as Record<string, unknown>;
  return set(novaRef, dadosComTimestamp).then(() => novaRef.key!);
}

/**
 * Salva ou sobrescreve um nó inteiro com timestamp de atualização.
 * Útil para imports em lote ou reset de dados.
 */
export function salvarComTimestamp<T extends Record<string, unknown>>(
  path: string,
  dados: T,
): Promise<void> {
  const dadosComTimestamp = {
    ...dados,
    atualizadoEm: ServerValue.TIMESTAMP,
  } as Record<string, unknown>;
  return set(nodeRef(path), dadosComTimestamp);
}

/**
 * Atualização parcial de um nó.
 * Ex: atualizarComTimestamp('/leads/-ABC123', { estagio: 'negociacao' })
 * Sempre adiciona atualizadoEm automaticamente.
 */
export function atualizarComTimestamp(
  path: string,
  dados: Record<string, unknown>,
): Promise<void> {
  if (!isObject(dados)) {
    return Promise.reject(new Error('[FirebaseRTDB] dados deve ser um objeto'));
  }
  return update(nodeRef(path), {
    ...dados,
    atualizadoEm: ServerValue.TIMESTAMP,
  });
}

/**
 * Exclui um nó do RTDB.
 */
export function excluirNo(path: string): Promise<void> {
  return remove(nodeRef(path));
}

// =============================================================================
// FUNÇÕES DE LEITURA EM TEMPO REAL (onValue)
// =============================================================================

/**
 * Escuta um nó em tempo real usando onValue.
 *
 * Retorna uma função de cleanup (Unsubscribe) que deve ser chamada
 * no cleanup do useEffect para evitar vazamento de memória.
 *
 * Exemplo de uso:
 *   useEffect(() => {
 *     const cleanup = escutar<LeadRTDB>('/leads', (dados) => {
 *       if (dados) setLeads(dados);
 *     });
 *     return cleanup;
 *   }, []);
 */
export function escutar<T extends Record<string, unknown>>(
  path: string,
  callback: (dados: Record<string, T> | null) => void,
  onError?: (erro: Error) => void,
): Unsubscribe {
  const dbRef = nodeRef(path);

  if (!dbRef || !dbRef.toString) {
    const errorMsg = `[FirebaseRTDB] Caminho inválido: "${path}"`;
    console.error(errorMsg);
    const noop = () => {};
    return noop;
  }

  const listener = onValue(
    dbRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        callback((typeof val === 'object' && val !== null ? val : {}) as Record<string, T>);
      } else {
        callback(null);
      }
    },
    (error) => {
      const msg = `[FirebaseRTDB] Erro no listener em "${path}": ${error.message}`;
      console.error(msg, error);
      if (onError) onError(error);
    },
  );

  return () => {
    try {
      off(dbRef, 'value', listener);
    } catch (e) {
      console.warn(`[FirebaseRTDB] Erro ao remover listener de "${path}":`, e);
    }
  };
}

/**
 * Leitura única (get). Útil para buscas pontuais como carregar
 * configurações ou verificar existência de dados sem manter listener.
 *
 * Exemplo:
 *   const tarefas = await lerUnico<TarefaRTDB>('/tarefas');
 */
export async function lerUnico<T extends Record<string, unknown>>(
  path: string,
): Promise<Record<string, T> | null> {
  try {
    const snapshot = await get(nodeRef(path));
    return snapshot.exists()
      ? (snapshot.val() as Record<string, T>)
      : null;
  } catch (error) {
    console.error(`[FirebaseRTDB] Erro em lerUnico("${path}"):`, error);
    throw error;
  }
}

/**
 * Conta quantos filhos existem em um nó (leitura eficiente sem baixar os dados).
 */
export async function contarFilhos(path: string): Promise<number> {
  try {
    const snapshot = await get(nodeRef(path));
    return snapshot.exists() ? snapshot.size : 0;
  } catch (error) {
    console.error(`[FirebaseRTDB] Erro em contarFilhos("${path}"):`, error);
    return 0;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  app,
  database,
  nodeRef,
  keepSynced,
  ServerValue,
};

export type { Unsubscribe };
