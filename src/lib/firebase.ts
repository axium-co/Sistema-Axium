import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, isConfigured as isFirebaseConfigured };

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
