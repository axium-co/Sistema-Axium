import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  closestCorners
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { useCRM } from '../../contexts/CRMContext';
import type { Lead } from '../../contexts/CRMContext';

const STAGES = [
  'Novos Leads',
  'Primeiro Contato',
  'Contato Ativo',
  'Reunião Agendada',
  'Follow Up',
  'Proposta Enviada',
  'Contrato Fechado',
  'Perdido'
];

interface LeadCardProps {
  lead: Lead;
  isClosed: boolean;
}

const DraggableLeadCard = ({ lead, isClosed }: LeadCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white p-2 md:p-4 rounded-xl border border-neutral-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-black hover:shadow-md transition-all cursor-grab active:cursor-grabbing group ${isDragging ? 'opacity-50 grayscale' : ''}`}
    >
      <div className="font-bold text-[11px] md:text-[13px] text-black mb-0.5">{lead.name}</div>
      <div className="text-[9px] md:text-[10px] text-neutral-500 font-semibold mb-2 md:mb-3">{lead.niche}</div>
      
      {isClosed && (
        <div className="pt-2 md:pt-3 border-t border-neutral-100 mt-2 md:mt-3">
          <div className="flex justify-between items-center gap-2">
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[8px] text-neutral-400 font-bold uppercase tracking-[0.1em]">Valor</span>
              <span className="text-[10px] md:text-xs font-black text-black mt-0.5">{lead.value || 'R$ 0,00'}</span>
            </div>
            <div className="w-5 md:w-6 h-5 md:h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] md:text-[10px] font-bold flex-shrink-0">
              ✓
            </div>
          </div>
        </div>
      )}

      {!isClosed && (
        <div className="flex justify-end">
          <div className="w-6 h-6 rounded-full bg-neutral-50 flex items-center justify-center text-[10px] font-bold text-neutral-400 group-hover:bg-black group-hover:text-white transition-colors">
            →
          </div>
        </div>
      )}
    </div>
  );
};

// Static card for DragOverlay
const StaticLeadCard = ({ lead, isClosed }: LeadCardProps) => (
  <div className="bg-white p-4 rounded-xl border border-black shadow-xl rotate-3 scale-105 pointer-events-none">
    <div className="font-bold text-[13px] text-black mb-0.5">{lead.name}</div>
    <div className="text-[10px] text-neutral-500 font-semibold mb-3">{lead.niche}</div>
    {isClosed && (
      <div className="pt-3 border-t border-neutral-100 mt-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-[0.1em]">Valor do Contrato</span>
            <span className="text-xs font-black text-black mt-0.5">{lead.value || 'R$ 0,00'}</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
            ✓
          </div>
        </div>
      </div>
    )}
  </div>
);

const DroppableColumn = ({ stage, children, count, totalValue, formatCurrency }: any) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const isClosed = stage === 'Contrato Fechado';

  return (
    <div 
      ref={setNodeRef}
      className={`bg-neutral-50/50 border-2 rounded-xl w-[300px] shrink-0 flex flex-col max-h-full transition-colors ${isOver ? 'border-black bg-neutral-100/50' : 'border-transparent'}`}
    >
      <div className="bg-neutral-50 border-b border-neutral-200 rounded-t-xl">
        {/* Column Header */}
        <div className="p-5 border-b border-neutral-200 bg-white rounded-t-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-black text-black uppercase tracking-widest">{stage}</h3>
            <span className="text-[10px] font-bold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-md">
              {count}
            </span>
          </div>
          
          {isClosed ? (
            <div className="flex flex-col">
              <span className="text-lg font-black text-black tracking-tight">{formatCurrency(totalValue)}</span>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Faturamento Real</span>
            </div>
          ) : (
            <div className="h-[38px] flex items-center">
              <div className="h-1.5 w-12 bg-neutral-100 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Lead Cards List */}
        <div className="p-3 space-y-3 overflow-y-auto min-h-[200px]">
          {children}
          {count === 0 && !isOver && (
            <div className="py-12 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center opacity-40">
              <div className="w-8 h-8 rounded-full bg-neutral-100 mb-2"></div>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Sem leads</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CRMPipeline = () => {
  const { leads, updateLead, searchTerm } = useCRM();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleDragStart = (event: any) => {
    setActiveLead(event.active.data.current.lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (over && active.id !== over.id) {
      const leadId = active.id as string;
      const newStage = over.id as string;
      
      // Update stage if the lead was dropped over a column
      if (STAGES.includes(newStage)) {
        updateLead(leadId, { stage: newStage });
      }
    }
  };

  // Helper to filter leads by search term
  const getFilteredLeads = (stage: string) => {
    return leads.filter(l => 
      l.stage === stage && (
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const getFilteredTotalValue = (filteredLeads: Lead[]) => {
    return filteredLeads.reduce((acc, lead) => {
      const val = lead.value || '';
      if (!val) return acc;
      const cleanValue = val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      const num = parseFloat(cleanValue);
      return acc + (!isNaN(num) ? num : 0);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-black tracking-tight mb-1">Pipeline</h1>
        <p className="text-neutral-500 text-sm">Visualize o progresso das suas oportunidades. Arraste e solte para mover entre etapas.</p>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-6">
          <div className="flex gap-5 min-w-max h-full items-start">
            {STAGES.map((stage) => {
              const columnLeads = getFilteredLeads(stage);
              const totalValue = getFilteredTotalValue(columnLeads);

              return (
                <DroppableColumn 
                  key={stage} 
                  stage={stage} 
                  count={columnLeads.length}
                  totalValue={totalValue}
                  formatCurrency={formatCurrency}
                >
                  {columnLeads.map(lead => (
                    <DraggableLeadCard 
                      key={lead.id} 
                      lead={lead} 
                      isClosed={stage === 'Contrato Fechado'} 
                    />
                  ))}
                </DroppableColumn>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeLead ? (
            <StaticLeadCard 
              lead={activeLead} 
              isClosed={activeLead.stage === 'Contrato Fechado'} 
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default CRMPipeline;
