import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { type WhatsAppTemplate, DEFAULT_TEMPLATES } from '../lib/whatsapp';
import { generateUUID } from '../lib/uuid';
import { useCollectionSync } from '../lib/sync';
import { WHATSAPP_TEMPLATES_COLLECTION } from '../lib/firebase';

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

function loadFallbackTemplates(): WhatsAppTemplate[] {
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
  const fallbackTemplates = useMemo(() => loadFallbackTemplates(), []);

  const {
    data: syncedTemplates,
    add: addToFirestore,
    update: updateInFirestore,
    remove: removeFromFirestore,
  } = useCollectionSync<WhatsAppTemplate>(
    WHATSAPP_TEMPLATES_COLLECTION,
    STORAGE_KEY,
    [],
  );

  const templates = syncedTemplates.length > 0 ? syncedTemplates : fallbackTemplates;

  const addTemplate = useCallback((template: Omit<WhatsAppTemplate, 'id'>) => {
    addToFirestore(template);
  }, [addToFirestore]);

  const updateTemplate = useCallback((id: string, fields: Partial<WhatsAppTemplate>) => {
    updateInFirestore(id, fields);
  }, [updateInFirestore]);

  const deleteTemplate = useCallback((id: string) => {
    removeFromFirestore(id);
  }, [removeFromFirestore]);

  const duplicateTemplate = useCallback((id: string) => {
    const source = templates.find(t => t.id === id);
    if (!source) return;
    const maxOrder = Math.max(...templates.map(t => t.order), -1);
    addToFirestore({
      ...source,
      name: `${source.name} (cópia)`,
      order: maxOrder + 1,
    });
  }, [templates, addToFirestore]);

  const reorderTemplate = useCallback((id: string, direction: 'up' | 'down') => {
    const sorted = [...templates].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(t => t.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const reordered = sorted.map((t, i) => ({ ...t, order: i }));
    reordered.forEach(t => updateInFirestore(t.id, { order: t.order }));
  }, [templates, updateInFirestore]);

  const toggleTemplateActive = useCallback((id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) {
      updateInFirestore(id, { active: !t.active });
    }
  }, [templates, updateInFirestore]);

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
