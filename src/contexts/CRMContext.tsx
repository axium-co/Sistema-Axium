import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { parseMonetaryValue, calculateTotalValue, groupLeadsByStage, type Stage } from '../lib/crmHelpers';
import { generateUUID } from '../lib/uuid';
import { api } from '../lib/api';
import { useApiCrud } from '../lib/use-api-crud';

export interface Lead {
  id: string;
  name: string;
  niche: string;
  whatsapp: string;
  email: string;
  instagram: string;
  stage: string;
  origin?: string;
  prospectionMethod?: string;
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
  isLoading: boolean;
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
  const [eventsData, setEventsData] = useState<CalendarEvent[]>([]);
  const [eventsStatus, setEventsStatus] = useState<string>('loading');

  const {
    data: leads,
    status: leadsStatus,
    error: leadsError,
    add: addLeadApi,
    update: updateLeadApi,
    remove: removeLeadApi,
  } = useApiCrud<Lead>('/leads');

  useEffect(() => {
    let active = true;

    const fetchEvents = () => {
      api.get<CalendarEvent[]>('/events')
        .then(data => {
          if (active) {
            setEventsData(data);
            setEventsStatus('synced');
          }
        })
        .catch(err => {
          console.error('[CRM] Erro ao carregar eventos:', err);
          if (active) setEventsStatus('error');
        });
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchNotifications = () => {
      api.get<Notification[]>('/notifications')
        .then(data => {
          if (active) setNotifications(data);
        })
        .catch(err => {
          console.error('[CRM] Erro ao carregar notificações:', err);
        });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const events = eventsData;
  const syncError = leadsError;
  const syncStatus = leadsStatus === 'error' || eventsStatus === 'error' ? 'error' : leadsStatus;
  const isLoading = leadsStatus === 'loading' && eventsStatus === 'loading';

  const leadsByStage = useMemo(() => groupLeadsByStage(leads), [leads]);
  const totalPipelineValue = useMemo(() => calculateTotalValue(leads), [leads]);

  const markNotificationsAsRead = useCallback(() => {
    api.put('/notifications/read-all', {}).catch(err =>
      console.error('[CRM] Erro ao marcar notificações como lidas:', err)
    );
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    api.put('/notifications/read-all', {}).catch(err =>
      console.error('[CRM] Erro ao limpar notificações:', err)
    );
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    api.delete(`/notifications/${id}`).catch(err =>
      console.error('[CRM] Erro ao remover notificação:', err)
    );
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const pushNotificationCb = useCallback((title: string, description: string, type: Notification['type']) => {
    api.post<Notification>('/notifications', { title, description, type, time: new Date().toISOString() })
      .then(created => {
        setNotifications(prev => [created, ...prev]);
      })
      .catch(err => {
        console.error('[CRM] Erro ao criar notificação:', err);
        pushNotification(setNotifications, title, description, type);
      });
  }, []);

  const addLead = useCallback(async (lead: LeadInput) => {
    try {
      await addLeadApi(lead);
      pushNotificationCb('Novo Lead', `${lead.name} foi adicionado ao sistema.`, 'lead');
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      throw error;
    }
  }, [addLeadApi, pushNotificationCb]);

  const updateLead = useCallback(async (id: string, fields: LeadUpdate) => {
    try {
      await updateLeadApi(id, fields);
      const old = leads.find(l => l.id === id);
      if (old) {
        const changedFields = Object.keys(fields).filter(k =>
          (fields as unknown as Record<string, unknown>)[k] !== (old as unknown as Record<string, unknown>)[k]
        );
        if (changedFields.length > 0) {
          pushNotificationCb('Lead Atualizado', `${old.name} teve dados alterados.`, 'lead');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      throw error;
    }
  }, [leads, updateLeadApi, pushNotificationCb]);

  const updateLeadStage = useCallback(async (id: string, stage: string) => {
    try {
      await updateLeadApi(id, { stage } as Partial<Lead>);
      const old = leads.find(l => l.id === id);
      if (old && old.stage !== stage) {
        pushNotificationCb('Lead Movido', `${old.name} movido de "${old.stage}" para "${stage}".`, 'lead');
      }
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      throw error;
    }
  }, [leads, updateLeadApi, pushNotificationCb]);

  const deleteLead = useCallback(async (id: string) => {
    try {
      await removeLeadApi(id);
      const old = leads.find(l => l.id === id);
      if (old) {
        pushNotificationCb('Lead Removido', `${old.name} foi removido do sistema.`, 'lead');
      }
    } catch (error) {
      console.error('Erro ao remover lead:', error);
      throw error;
    }
  }, [leads, removeLeadApi, pushNotificationCb]);

  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    try {
      const created = await api.post<CalendarEvent>('/events', event);
      setEventsData(prev => [...prev, created]);
      pushNotification(setNotifications, 'Evento Criado', `${event.title} foi adicionado ao calendário.`, 'meeting');
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (id: string, fields: Partial<CalendarEvent>) => {
    try {
      const updated = await api.put<CalendarEvent>(`/events/${id}`, fields);
      setEventsData(prev => prev.map(e => e.id === id ? updated : e));
      const old = events.find(e => e.id === id);
      if (old) {
        pushNotification(setNotifications, 'Evento Atualizado', `${old.title} foi modificado.`, 'meeting');
      }
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }, [events]);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await api.delete(`/events/${id}`);
      setEventsData(prev => prev.filter(e => e.id !== id));
      const old = events.find(e => e.id === id);
      if (old) {
        pushNotification(setNotifications, 'Evento Removido', `${old.title} foi removido do calendário.`, 'meeting');
      }
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      throw error;
    }
  }, [events]);

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
    isLoading,
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
    leads, events, searchTerm, notifications, isLoading, markNotificationsAsRead,
    clearNotifications, removeNotification, pushNotificationCb,
    addLead, updateLead, updateLeadStage, deleteLead,
    getLeadsByStage, getTotalValueByStage,
    addEvent, updateEvent, deleteEvent,
    leadsByStage, totalPipelineValue, syncError, syncStatus,
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
