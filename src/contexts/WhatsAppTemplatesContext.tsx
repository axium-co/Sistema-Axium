import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { type WhatsAppTemplate, DEFAULT_TEMPLATES } from '../lib/whatsapp';
import { generateUUID } from '../lib/uuid';

const STORAGE_KEY = 'axium_whatsapp_templates_v1';

interface WhatsAppTemplatesContextType {
  templates: WhatsAppTemplate[];
  addTemplate: (template: Omit<WhatsAppTemplate, 'id'>) => void;
  updateTemplate: (id: string, fields: Partial<WhatsAppTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  reorderTemplate: (id: string, direction: 'up' | 'down') => void;
  toggleTemplateActive: (id: string) => void;
  activeTemplates: WhatsAppTemplate[];
}

const WhatsAppTemplatesContext = createContext<WhatsAppTemplatesContextType | undefined>(undefined);

function loadTemplates(): WhatsAppTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return DEFAULT_TEMPLATES.map((t, i) => ({
    ...t,
    id: generateUUID(),
  }));
}

export const WhatsAppTemplatesProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(loadTemplates);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const addTemplate = useCallback((template: Omit<WhatsAppTemplate, 'id'>) => {
    setTemplates(prev => [...prev, { ...template, id: generateUUID() }]);
  }, []);

  const updateTemplate = useCallback((id: string, fields: Partial<WhatsAppTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t));
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const duplicateTemplate = useCallback((id: string) => {
    setTemplates(prev => {
      const source = prev.find(t => t.id === id);
      if (!source) return prev;
      const maxOrder = Math.max(...prev.map(t => t.order), -1);
      return [...prev, { ...source, id: generateUUID(), name: `${source.name} (cópia)`, order: maxOrder + 1 }];
    });
  }, []);

  const reorderTemplate = useCallback((id: string, direction: 'up' | 'down') => {
    setTemplates(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === sorted.length - 1) return prev;

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
      return sorted.map((t, i) => ({ ...t, order: i }));
    });
  }, []);

  const toggleTemplateActive = useCallback((id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  }, []);

  const activeTemplates = useMemo(
    () => [...templates].filter(t => t.active).sort((a, b) => a.order - b.order),
    [templates]
  );

  const value = useMemo(() => ({
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    reorderTemplate,
    toggleTemplateActive,
    activeTemplates,
  }), [templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, reorderTemplate, toggleTemplateActive, activeTemplates]);

  return (
    <WhatsAppTemplatesContext.Provider value={value}>
      {children}
    </WhatsAppTemplatesContext.Provider>
  );
};

export const useWhatsAppTemplates = () => {
  const context = useContext(WhatsAppTemplatesContext);
  if (!context) {
    throw new Error('useWhatsAppTemplates must be used within a WhatsAppTemplatesProvider');
  }
  return context;
};
