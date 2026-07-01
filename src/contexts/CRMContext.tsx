import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { parseMonetaryValue, calculateTotalValue, groupLeadsByStage, type Stage } from '../lib/crmHelpers';
import { generateUUID } from '../lib/uuid';
import { useCollectionSync } from '../lib/sync';
import {
  LEADS_COLLECTION,
  EVENTS_COLLECTION,
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
  addLead: (lead: LeadInput) => Promise<void>;
  updateLead: (id: string, fields: LeadUpdate) => Promise<void>;
  updateLeadStage: (id: string, stage: string) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  getLeadsByStage: (stage: string) => Lead[];
  getTotalValueByStage: (stage: string) => number;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  leadsByStage: Record<Stage, Lead[]>;
  totalPipelineValue: number;
  syncError: string | null;
  syncStatus: string;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

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
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const {
    data: firestoreLeads,
    status: leadsStatus,
    error: leadsError,
    add: addLeadToFirestore,
    update: updateLeadInFirestore,
    remove: removeLeadFromFirestore,
  } = useCollectionSync<Lead>(
    LEADS_COLLECTION,
    'axium_leads_v2',
    [],
  );

  const {
    data: firestoreEvents,
    status: eventsStatus,
    error: eventsError,
    add: addEventToFirestore,
    update: updateEventInFirestore,
    remove: removeEventFromFirestore,
  } = useCollectionSync<CalendarEvent>(
    EVENTS_COLLECTION,
    'axium_events_v2',
    [],
  );

  const leads = firestoreLeads;
  const events = firestoreEvents;

  const syncError = leadsError || eventsError;
  const syncStatus = leadsStatus === 'offline' || eventsStatus === 'offline' ? 'offline' : leadsStatus;

  const leadsByStage = useMemo(() => groupLeadsByStage(leads), [leads]);
  const totalPipelineValue = useMemo(() => calculateTotalValue(leads), [leads]);

  const markNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const pushNotificationCb = useCallback((title: string, description: string, type: Notification['type']) => {
    pushNotification(setNotifications, title, description, type);
  }, []);

  const addLead = useCallback(async (lead: LeadInput) => {
    try {
      await addLeadToFirestore(lead);
      pushNotification(setNotifications, 'Novo Lead', `${lead.name} foi adicionado ao sistema.`, 'lead');
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      throw error;
    }
  }, [addLeadToFirestore]);

  const updateLead = useCallback(async (id: string, fields: LeadUpdate) => {
    try {
      await updateLeadInFirestore(id, fields);
      const old = leads.find(l => l.id === id);
      if (old) {
        const changedFields = Object.keys(fields).filter(k => (fields as unknown as Record<string, unknown>)[k] !== (old as unknown as Record<string, unknown>)[k]);
        if (changedFields.length > 0) {
          pushNotification(setNotifications, 'Lead Atualizado', `${old.name} teve dados alterados.`, 'lead');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      throw error;
    }
  }, [leads, updateLeadInFirestore]);

  const updateLeadStage = useCallback(async (id: string, stage: string) => {
    try {
      await updateLeadInFirestore(id, { stage } as Partial<Lead>);
      const old = leads.find(l => l.id === id);
      if (old && old.stage !== stage) {
        pushNotification(setNotifications, 'Lead Movido', `${old.name} movido de "${old.stage}" para "${stage}".`, 'lead');
      }
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      throw error;
    }
  }, [leads, updateLeadInFirestore]);

  const deleteLead = useCallback(async (id: string) => {
    try {
      await removeLeadFromFirestore(id);
      const old = leads.find(l => l.id === id);
      if (old) {
        pushNotification(setNotifications, 'Lead Removido', `${old.name} foi removido do sistema.`, 'lead');
      }
    } catch (error) {
      console.error('Erro ao remover lead:', error);
      throw error;
    }
  }, [leads, removeLeadFromFirestore]);

  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    try {
      await addEventToFirestore(event);
      pushNotification(setNotifications, 'Evento Criado', `${event.title} foi adicionado ao calendário.`, 'meeting');
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }, [addEventToFirestore]);

  const updateEvent = useCallback(async (id: string, fields: Partial<CalendarEvent>) => {
    try {
      await updateEventInFirestore(id, fields);
      const old = events.find(e => e.id === id);
      if (old) {
        pushNotification(setNotifications, 'Evento Atualizado', `${old.title} foi modificado.`, 'meeting');
      }
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }, [events, updateEventInFirestore]);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await removeEventFromFirestore(id);
      const old = events.find(e => e.id === id);
      if (old) {
        pushNotification(setNotifications, 'Evento Removido', `${old.title} foi removido do calendário.`, 'meeting');
      }
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      throw error;
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
    syncError,
    syncStatus,
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
    syncError,
    syncStatus,
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
