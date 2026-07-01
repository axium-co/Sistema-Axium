import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAdTYc8gSr005T5QeFVB2m1Nxg0pUpwko8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sistemaaxium.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sistemaaxium',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sistemaaxium.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '69845074869',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:69845074869:web:08c397278f5739bd4e8ffc',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-KNWTJWXGGW',
};

const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (!isConfigured) {
  console.warn(
    '[Firebase] Variáveis de ambiente do Firebase não configuradas.',
    '\n  O sistema continuará funcionando com localStorage como fallback.',
    '\n  Para conectar ao Firebase, configure as variáveis no arquivo .env:',
    '\n  VITE_FIREBASE_API_KEY=...',
    '\n  VITE_FIREBASE_AUTH_DOMAIN=...',
    '\n  VITE_FIREBASE_PROJECT_ID=...',
    '\n  VITE_FIREBASE_STORAGE_BUCKET=...',
    '\n  VITE_FIREBASE_MESSAGING_SENDER_ID=...',
    '\n  VITE_FIREBASE_APP_ID=...',
  );
} else {
  console.log('[Firebase] Firebase configurado com o projeto:', firebaseConfig.projectId);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

let isOnline = navigator.onLine;
let firestoreReady = false;

if (import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true') {
  console.warn('[Firebase] Usando Firestore Emulator (localhost:8080).');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

window.addEventListener('online', () => {
  isOnline = true;
  console.log('[Firebase] Conexão de rede restaurada. Reativando Firestore...');
  if (isConfigured) {
    enableNetwork(db)
      .then(() => {
        firestoreReady = true;
        console.log('[Firebase] Firestore online e sincronizando.');
      })
      .catch((err) =>
        console.error('[Firebase] Erro ao reativar rede:', err.code, err.message)
      );
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.warn('[Firebase] Conexão de rede perdida. Operações serão pausadas até reconectar.');
  if (isConfigured) {
    disableNetwork(db).catch((err) =>
      console.error('[Firebase] Erro ao desativar rede:', err.code, err.message)
    );
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('[Firebase] Usuário autenticado:', user.email);
  }
});

console.log('[Firebase] Módulo inicializado. Coleções disponíveis:', [
  'profiles', 'activity_logs', 'leads', 'events', 'notifications',
  'whatsapp_templates', 'boards', 'invoices', 'expenses', 'integrations',
  'employees', 'user_roles', 'page_events',
].join(', '));

export { app, auth, db, storage, analytics, isConfigured as isFirebaseConfigured, isOnline };

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

export const PROFILES_COLLECTION = 'profiles';
export const ACTIVITY_LOGS_COLLECTION = 'activity_logs';
export const LEADS_COLLECTION = 'leads';
export const EVENTS_COLLECTION = 'events';
export const NOTIFICATIONS_COLLECTION = 'notifications';
export const WHATSAPP_TEMPLATES_COLLECTION = 'whatsapp_templates';
export const BOARDS_COLLECTION = 'boards';
export const INVOICES_COLLECTION = 'invoices';
export const EXPENSES_COLLECTION = 'expenses';
export const INTEGRATIONS_COLLECTION = 'integrations';
export const EMPLOYEES_COLLECTION = 'employees';
export const USER_ROLES_COLLECTION = 'user_roles';
export const PAGE_EVENTS_COLLECTION = 'page_events';
