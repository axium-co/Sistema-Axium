import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { type WhatsAppTemplate, DEFAULT_TEMPLATES } from '../lib/whatsapp';
import { generateUUID } from '../lib/uuid';
import { useCollectionSync } from '../lib/sync';
import { WHATSAPP_TEMPLATES_COLLECTION } from '../lib/firebase';

const STORAGE_KEY = 'axium_whatsapp_templates_v1';

interface WhatsAppTemplatesContextType {
  templates: WhatsAppTemplate[];
  addTemplate: (template: Omit<WhatsAppTemplate, 'id'>) => Promise<void>;
  updateTemplate: (id: string, fields: Partial<WhatsAppTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<void>;
  reorderTemplate: (id: string, direction: 'up' | 'down') => Promise<void>;
  toggleTemplateActive: (id: string) => Promise<void>;
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

  const addTemplate = useCallback(async (template: Omit<WhatsAppTemplate, 'id'>) => {
    try {
      await addToFirestore(template);
    } catch (error) {
      console.error('Erro ao adicionar template:', error);
    }
  }, [addToFirestore]);

  const updateTemplate = useCallback(async (id: string, fields: Partial<WhatsAppTemplate>) => {
    try {
      await updateInFirestore(id, fields);
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
    }
  }, [updateInFirestore]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await removeFromFirestore(id);
    } catch (error) {
      console.error('Erro ao remover template:', error);
    }
  }, [removeFromFirestore]);

  const duplicateTemplate = useCallback(async (id: string) => {
    const source = templates.find(t => t.id === id);
    if (!source) return;
    const maxOrder = Math.max(...templates.map(t => t.order), -1);
    try {
      await addToFirestore({
        ...source,
        name: `${source.name} (cópia)`,
        order: maxOrder + 1,
      });
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
    }
  }, [templates, addToFirestore]);

  const reorderTemplate = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...templates].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(t => t.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const reordered = sorted.map((t, i) => ({ ...t, order: i }));
    try {
      await Promise.all(reordered.map(t => updateInFirestore(t.id, { order: t.order })));
    } catch (error) {
      console.error('Erro ao reordenar templates:', error);
    }
  }, [templates, updateInFirestore]);

  const toggleTemplateActive = useCallback(async (id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) {
      try {
        await updateInFirestore(id, { active: !t.active });
      } catch (error) {
        console.error('Erro ao alternar template:', error);
      }
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
