import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Lead {
  id: string;
  name: string;
  niche: string;
  whatsapp: string;
  email: string;
  instagram: string;
  stage: string;
  firstContact: string;
  closingDate: string;
  followUpReminder: string;
  address: string;
  gmnReviews: string;
  gmnStars: string;
  notes: string;
  value: string;
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

interface CRMContextType {
  leads: Lead[];
  events: CalendarEvent[];
  searchTerm: string;
  notifications: Notification[];
  setSearchTerm: (term: string) => void;
  markNotificationsAsRead: () => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  getLeadsByStage: (stage: string) => Lead[];
  getTotalValueByStage: (stage: string) => number;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
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

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Novo Lead Criado', description: 'O lead "Clínica Saúde" foi adicionado via importação.', time: '5 min atrás', isRead: false, type: 'lead' },
  { id: '2', title: 'Reunião em breve', description: 'Sua reunião com João Silva começa em 15 minutos.', time: '10 min atrás', isRead: false, type: 'meeting' },
  { id: '3', title: 'Follow-up pendente', description: 'Você tem 3 follow-ups agendados para hoje.', time: '1 hora atrás', isRead: true, type: 'system' },
];

export const CRMProvider = ({ children }: { children: ReactNode }) => {
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('axium_leads_v2');
      try {
        const parsed = stored ? JSON.parse(stored) : INITIAL_LEADS;
        return Array.isArray(parsed) ? parsed : INITIAL_LEADS;
      } catch (e) {
        return INITIAL_LEADS;
      }
    }
    return INITIAL_LEADS;
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('axium_events_v2');
      try {
        const parsed = stored ? JSON.parse(stored) : INITIAL_EVENTS;
        return Array.isArray(parsed) ? parsed : INITIAL_EVENTS;
      } catch (e) {
        return INITIAL_EVENTS;
      }
    }
    return INITIAL_EVENTS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    localStorage.setItem('axium_leads_v2', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('axium_events_v2', JSON.stringify(events));
  }, [events]);

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const addLead = (lead: Omit<Lead, 'id'>) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 9);
    setLeads(prev => [...prev, { ...lead, id }]);
    
    // Add notification
    const newNotification: Notification = {
      id: Math.random().toString(),
      title: 'Novo Lead',
      description: `${lead.name} foi adicionado ao sistema.`,
      time: 'Agora',
      isRead: false,
      type: 'lead'
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const updateLead = (id: string, updatedFields: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updatedFields } : l));
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 9);
    setEvents(prev => [...prev, { ...event, id }]);
  };

  const updateEvent = (id: string, updatedFields: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updatedFields } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const getLeadsByStage = useCallback((stage: string) => {
    return leads.filter(l => l.stage === stage);
  }, [leads]);

  const getTotalValueByStage = useCallback((stage: string) => {
    return leads
      .filter(l => l.stage === stage)
      .reduce((acc, lead) => {
        const val = lead.value || '';
        if (!val) return acc;
        const cleanValue = val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        const num = parseFloat(cleanValue);
        return acc + (!isNaN(num) ? num : 0);
      }, 0);
  }, [leads]);

  return (
    <CRMContext.Provider value={{ 
      leads, 
      events, 
      searchTerm,
      notifications,
      setSearchTerm,
      markNotificationsAsRead,
      addLead, 
      updateLead, 
      deleteLead, 
      getLeadsByStage, 
      getTotalValueByStage,
      addEvent,
      updateEvent,
      deleteEvent
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within a CRMProvider');
  return context;
};
