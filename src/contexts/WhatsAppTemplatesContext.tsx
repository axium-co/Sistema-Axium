import { createContext, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { type WhatsAppTemplate, DEFAULT_TEMPLATES } from '../lib/whatsapp';
import { generateUUID } from '../lib/uuid';
import { useCollectionSync } from '../lib/sync';
import { WHATSAPP_TEMPLATES_COLLECTION } from '../lib/firebase';

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

export const WhatsAppTemplatesProvider = ({ children }: { children: ReactNode }) => {
  const fallbackTemplates = useMemo(() =>
    DEFAULT_TEMPLATES.map((t, i) => ({
      ...t,
      id: generateUUID(),
    })),
  []);

  const {
    data: syncedTemplates,
    add: addToFirestore,
    update: updateInFirestore,
    remove: removeFromFirestore,
  } = useCollectionSync<WhatsAppTemplate>(
    WHATSAPP_TEMPLATES_COLLECTION,
    'axium_whatsapp_templates_v1',
    [],
  );

  const templates = syncedTemplates.length > 0 ? syncedTemplates : fallbackTemplates;

  const addTemplate = useCallback(async (template: Omit<WhatsAppTemplate, 'id'>) => {
    await addToFirestore(template);
  }, [addToFirestore]);

  const updateTemplate = useCallback(async (id: string, fields: Partial<WhatsAppTemplate>) => {
    await updateInFirestore(id, fields);
  }, [updateInFirestore]);

  const deleteTemplate = useCallback(async (id: string) => {
    await removeFromFirestore(id);
  }, [removeFromFirestore]);

  const duplicateTemplate = useCallback(async (id: string) => {
    const source = templates.find(t => t.id === id);
    if (!source) return;
    const maxOrder = Math.max(...templates.map(t => t.order), -1);
    await addToFirestore({
      ...source,
      name: `${source.name} (cópia)`,
      order: maxOrder + 1,
    });
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
    await Promise.all(reordered.map(t => updateInFirestore(t.id, { order: t.order })));
  }, [templates, updateInFirestore]);

  const toggleTemplateActive = useCallback(async (id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) {
      await updateInFirestore(id, { active: !t.active });
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
