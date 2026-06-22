import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { STAGES, STAGE_CONFIG, parseMonetaryValue, calculateTotalValue, groupLeadsByStage, type Stage } from '../lib/crmHelpers';
import { generateUUID } from '../lib/uuid';
import { useCollectionSync } from '../lib/sync';
import { useAuth } from './AuthContext';
import {
  LEADS_COLLECTION,
  EVENTS_COLLECTION,
  NOTIFICATIONS_COLLECTION,
  isFirebaseConfigured,
} from '../lib/firebase';

export interface Lead {
  id: string;
  name: string;
  niche: string;
  whatsapp: string;
  email: string;
  instagram: string;
  stage: string;
  origin?: string;
  firstContact: string;
  closingDate: string;
  followUpReminder: string;
  address: string;
  gmnReviews: string;
  gmnStars: string;
  notes: string;
  value: string;
  lastModifiedBy?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  createdBy?: string;
  activityType?: string;
  dateTime: string;
  meetingLink?: string;
  description?: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  type: 'lead' | 'meeting' | 'system';
}

type LeadInput = Omit<Lead, 'id'>;
type LeadUpdate = Partial<Omit<Lead, 'id'>>;

interface CRMContextType {
  leads: Lead[];
  events: CalendarEvent[];
  searchTerm: string;
  notifications: Notification[];
  setSearchTerm: (term: string) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  pushNotification: (title: string, description: string, type: Notification['type']) => void;
  addLead: (lead: LeadInput) => void;
  updateLead: (id: string, fields: LeadUpdate) => void;
  updateLeadStage: (id: string, stage: string) => void;
  deleteLead: (id: string) => void;
  getLeadsByStage: (stage: string) => Lead[];
  getTotalValueByStage: (stage: string) => number;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  leadsByStage: Record<Stage, Lead[]>;
  totalPipelineValue: number;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const INITIAL_LEADS: Lead[] = [
  {
    id: '1', name: 'João Silva', niche: 'Odontologia', whatsapp: '11 99999-9999',
    email: 'joao@example.com', instagram: '@joaosilva', stage: 'Reunião Agendada',
    firstContact: '2026-04-01', closingDate: '2026-04-30', followUpReminder: '2026-04-22',
    address: 'São Paulo - SP', gmnReviews: '248', gmnStars: '4.7',
    notes: 'Cliente interessado no plano premium.', value: 'R$ 5.000',
  },
  {
    id: '2', name: 'Maria Santos', niche: 'Dermatologia', whatsapp: '11 88888-8888',
    email: 'maria@example.com', instagram: '@mariasan', stage: 'Novos Leads',
    firstContact: '2026-04-10', closingDate: '', followUpReminder: '2026-04-25',
    address: 'Rio de Janeiro - RJ', gmnReviews: '89', gmnStars: '4.2',
    notes: '', value: 'R$ 8.000',
  },
  {
    id: '3', name: 'Pedro Oliveira', niche: 'Clínica Geral', whatsapp: '11 77777-7777',
    email: 'pedro@example.com', instagram: '@pedrooli', stage: 'Proposta Enviada',
    firstContact: '2026-03-20', closingDate: '2026-05-15', followUpReminder: '2026-04-23',
    address: 'Belo Horizonte - MG', gmnReviews: '312', gmnStars: '4.9',
    notes: 'Aguardando aprovação da proposta.', value: 'R$ 12.000',
  },
  {
    id: '4', name: 'Clínica Sorriso', niche: 'Odontologia', whatsapp: '11 5555-5555',
    email: 'contato@sorriso.com', instagram: '@clinicasorriso', stage: 'Contrato Fechado',
    firstContact: '2026-03-10', closingDate: '2026-04-15', followUpReminder: '',
    address: 'Curitiba - PR', gmnReviews: '150', gmnStars: '4.8',
    notes: 'Contrato fechado!', value: 'R$ 15.000',
  }
];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Reunião com Cliente A',
    createdBy: 'Admin',
    activityType: 'Reunião',
    dateTime: '2026-04-21T10:00:00',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    description: 'Apresentação do plano premium.'
  },
  {
    id: '2',
    title: 'Follow-up Leads',
    createdBy: 'Vendedor 1',
    activityType: 'Ligação',
    dateTime: '2026-04-21T14:00:00',
    description: 'Retornar contato para leads qualificados.'
  },
  {
    id: '3',
    title: 'Revisão de Pipeline',
    createdBy: 'Gerente',
    activityType: 'Treinamento',
    dateTime: '2026-04-22T16:00:00',
    description: 'Alinhamento de metas semanais.'
  }
];

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function now(): string {
  return new Date().toISOString();
}

function pushNotification(
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  title: string,
  description: string,
  type: Notification['type']
) {
  const n: Notification = {
    id: generateUUID(),
    title,
    description,
    time: now(),
    isRead: false,
    type,
  };
  setNotifications(prev => [n, ...prev]);
}

export const CRMProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage('axium_notifications_v1', []));
  const localMutationRef = useRef(false);

  const {
    data: firestoreLeads,
    add: addLeadToFirestore,
    update: updateLeadInFirestore,
    remove: removeLeadFromFirestore,
  } = useCollectionSync<Lead>(
    LEADS_COLLECTION,
    'axium_leads_v2',
    [],
    user?.id,
  );

  const {
    data: firestoreEvents,
    add: addEventToFirestore,
    update: updateEventInFirestore,
    remove: removeEventFromFirestore,
  } = useCollectionSync<CalendarEvent>(
    EVENTS_COLLECTION,
    'axium_events_v2',
    [],
    user?.id,
  );

  const leads = firestoreLeads.length > 0
    ? firestoreLeads
    : loadFromStorage<Lead[]>('axium_leads_v2', INITIAL_LEADS);
  const events = firestoreEvents.length > 0
    ? firestoreEvents
    : loadFromStorage<CalendarEvent[]>('axium_events_v2', INITIAL_EVENTS);

  useEffect(() => {
    localStorage.setItem('axium_leads_v2', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('axium_events_v2', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('axium_notifications_v1', JSON.stringify(notifications));
  }, [notifications]);

  const leadsByStage = useMemo(() => groupLeadsByStage(leads), [leads]);
  
  const totalPipelineValue = useMemo(() => calculateTotalValue(leads), [leads]);

  const markNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('axium_notifications_v1');
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const pushNotificationCb = useCallback((title: string, description: string, type: Notification['type']) => {
    pushNotification(setNotifications, title, description, type);
  }, []);

  const addLead = useCallback((lead: LeadInput) => {
    addLeadToFirestore(lead);
    pushNotification(setNotifications, 'Novo Lead', `${lead.name} foi adicionado ao sistema.`, 'lead');
  }, [addLeadToFirestore]);

  const updateLead = useCallback((id: string, fields: LeadUpdate) => {
    const currentLeads = leads;
    const old = currentLeads.find(l => l.id === id);
    updateLeadInFirestore(id, fields);
    if (old) {
      const changedFields = Object.keys(fields).filter(k => (fields as any)[k] !== (old as any)[k]);
      if (changedFields.length > 0) {
        pushNotification(setNotifications, 'Lead Atualizado', `${old.name} teve dados alterados.`, 'lead');
      }
    }
  }, [leads, updateLeadInFirestore]);

  const updateLeadStage = useCallback((id: string, stage: string) => {
    const currentLeads = leads;
    const old = currentLeads.find(l => l.id === id);
    updateLeadInFirestore(id, { stage } as Partial<Lead>);
    if (old && old.stage !== stage) {
      pushNotification(setNotifications, 'Lead Movido', `${old.name} movido de "${old.stage}" para "${stage}".`, 'lead');
    }
  }, [leads, updateLeadInFirestore]);

  const deleteLead = useCallback((id: string) => {
    const currentLeads = leads;
    const old = currentLeads.find(l => l.id === id);
    removeLeadFromFirestore(id);
    if (old) {
      pushNotification(setNotifications, 'Lead Removido', `${old.name} foi removido do sistema.`, 'lead');
    }
  }, [leads, removeLeadFromFirestore]);

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    addEventToFirestore(event);
    pushNotification(setNotifications, 'Evento Criado', `${event.title} foi adicionado ao calendário.`, 'meeting');
  }, [addEventToFirestore]);

  const updateEvent = useCallback((id: string, fields: Partial<CalendarEvent>) => {
    const currentEvents = events;
    const old = currentEvents.find(e => e.id === id);
    updateEventInFirestore(id, fields);
    if (old) {
      pushNotification(setNotifications, 'Evento Atualizado', `${old.title} foi modificado.`, 'meeting');
    }
  }, [events, updateEventInFirestore]);

  const deleteEvent = useCallback((id: string) => {
    const currentEvents = events;
    const old = currentEvents.find(e => e.id === id);
    removeEventFromFirestore(id);
    if (old) {
      pushNotification(setNotifications, 'Evento Removido', `${old.title} foi removido do calendário.`, 'meeting');
    }
  }, [events, removeEventFromFirestore]);

  const getLeadsByStage = useCallback((stage: string) => {
    return leads.filter(l => l.stage === stage);
  }, [leads]);

  const getTotalValueByStage = useCallback((stage: string) => {
    return leads
      .filter(l => l.stage === stage)
      .reduce((acc, lead) => acc + parseMonetaryValue(lead.value), 0);
  }, [leads]);

  const value = useMemo(() => ({
    leads,
    events,
    searchTerm,
    notifications,
    setSearchTerm,
    markNotificationsAsRead,
    clearNotifications,
    removeNotification,
    pushNotification: pushNotificationCb,
    addLead,
    updateLead,
    updateLeadStage,
    deleteLead,
    getLeadsByStage,
    getTotalValueByStage,
    addEvent,
    updateEvent,
    deleteEvent,
    leadsByStage,
    totalPipelineValue,
  }), [
    leads,
    events,
    searchTerm,
    notifications,
    markNotificationsAsRead,
    clearNotifications,
    removeNotification,
    pushNotificationCb,
    addLead,
    updateLead,
    updateLeadStage,
    deleteLead,
    getLeadsByStage,
    getTotalValueByStage,
    addEvent,
    updateEvent,
    deleteEvent,
    leadsByStage,
    totalPipelineValue,
  ]);

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
