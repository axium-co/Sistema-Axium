import { createContext, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { type WhatsAppTemplate } from '../lib/whatsapp';
import { useApiCrud } from '../lib/use-api-crud';

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
  const {
    data: templates,
    add: addToApi,
    update: updateInApi,
    remove: removeFromApi,
  } = useApiCrud<WhatsAppTemplate>('/whatsapp-templates');

  const addTemplate = useCallback(async (template: Omit<WhatsAppTemplate, 'id'>) => {
    await addToApi(template);
  }, [addToApi]);

  const updateTemplate = useCallback(async (id: string, fields: Partial<WhatsAppTemplate>) => {
    await updateInApi(id, fields);
  }, [updateInApi]);

  const deleteTemplate = useCallback(async (id: string) => {
    await removeFromApi(id);
  }, [removeFromApi]);

  const duplicateTemplate = useCallback(async (id: string) => {
    const source = templates.find(t => t.id === id);
    if (!source) return;
    const maxOrder = Math.max(...templates.map(t => t.order), -1);
    await addToApi({
      ...source,
      name: `${source.name} (cópia)`,
      order: maxOrder + 1,
    });
  }, [templates, addToApi]);

  const reorderTemplate = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...templates].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(t => t.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const reordered = sorted.map((t, i) => ({ ...t, order: i }));
    await Promise.all(reordered.map(t => updateInApi(t.id, { order: t.order })));
  }, [templates, updateInApi]);

  const toggleTemplateActive = useCallback(async (id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) {
      await updateInApi(id, { active: !t.active });
    }
  }, [templates, updateInApi]);

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
