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
import { useFilters } from '../../contexts/FilterContext';
import type { Lead } from '../../contexts/CRMContext';
import { Filter, XCircle } from 'lucide-react';

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
      className={`bg-white p-2 md:p-4 rounded-md border border-neutral-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-black hover:shadow-md transition-all cursor-grab active:cursor-grabbing group ${isDragging ? 'opacity-50 grayscale' : ''}`}
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
  <div className="bg-white p-4 rounded-md border border-black shadow-xl rotate-3 scale-105 pointer-events-none">
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
      className={`bg-neutral-50/50 border-2 rounded-md w-[300px] shrink-0 flex flex-col max-h-full transition-colors ${isOver ? 'border-black bg-neutral-100/50' : 'border-transparent'}`}
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
            <div className="py-12 border-2 border-dashed border-neutral-200 rounded-md flex flex-col items-center justify-center opacity-40">
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
  const { leads, getTotalValueByStage, updateLead } = useCRM();
  const { filters, hasActiveFilters } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredLeadsBase = filters.stages.length > 0 || filters.niches.length > 0 || filters.dateFilter !== ''
    ? leads.filter(lead => {
        if (filters.stages.length > 0 && !filters.stages.includes(lead.stage)) return false;
        if (filters.niches.length > 0 && !filters.niches.includes(lead.niche)) return false;
        if (filters.dateFilter) {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (filters.dateFilter === 'today') {
            if (!lead.firstContact) return false;
            const leadDate = new Date(lead.firstContact);
            return leadDate.toDateString() === today.toDateString();
          } else if (filters.dateFilter === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (!lead.firstContact) return false;
            const leadDate = new Date(lead.firstContact);
            return leadDate >= weekAgo;
          } else if (filters.dateFilter === 'month') {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (!lead.firstContact) return false;
            const leadDate = new Date(lead.firstContact);
            return leadDate >= monthAgo;
          }
        }
        return true;
      })
    : leads;

  // Helper to filter leads by search term
  const getFilteredLeads = (stage: string) => {
    return filteredLeadsBase.filter(l => 
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
    <div className="relative flex flex-col h-full">
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute top-14 left-4 w-[280px] bg-white border border-neutral-200 rounded-xl shadow-xl z-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-black uppercase tracking-widest">Filtros</span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-neutral-100 rounded-md">
                <XCircle size={14} className="text-neutral-400" />
              </button>
            </div>
            <p className="text-[10px] text-neutral-400">Aplique filtros na aba Leads para filtrar dados aqui.</p>
          </div>
        </>
      )}

      <div className="mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight mb-1">Pipeline</h1>
          <p className="text-neutral-500 text-sm">Visualize o progresso das suas oportunidades. Arraste e solte para mover entre etapas.</p>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all relative ${hasActiveFilters ? 'bg-black text-white border-black' : 'bg-white border-neutral-200 text-neutral-700 hover:border-black'}`}
        >
          <Filter size={14} />
          <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
          {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
        </button>
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
