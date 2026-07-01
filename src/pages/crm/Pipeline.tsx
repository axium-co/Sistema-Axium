import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { useCRM } from '../../contexts/CRMContext';
import { useFilters } from '../../contexts/FilterContext';
import type { Lead } from '../../contexts/CRMContext';
import { Filter, XCircle, ChevronDown } from 'lucide-react';
import {
  STAGES,
  type Stage,
  STAGE_CONFIG,
  formatCurrency,
  isValidStage,
  calculateTotalValue,
} from '../../lib/crmHelpers';
import { MessageCircle } from 'lucide-react';
import WhatsAppModal from '../../components/WhatsAppModal';

// =============================================================================
// Components
// =============================================================================

interface LeadCardProps {
  lead: Lead;
  isClosed: boolean;
  onStageChange: (leadId: string, newStage: Stage) => void;
  onWhatsAppClick?: (name: string, phone: string) => void;
}

const StageMenu = memo<{
  lead: Lead;
  onSelect: (stage: Stage) => void;
  onClose: () => void;
}>(({ lead, onSelect, onClose }) => {
  const availableStages = STAGES.filter((s) => s !== lead.stage);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-neutral-200 rounded-xl shadow-xl py-1 min-w-[180px]">
        <div className="px-3 py-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
          Mover para
        </div>
        {availableStages.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(stage);
            }}
            className="w-full text-left px-3 py-2 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors"
          >
            {stage}
          </button>
        ))}
      </div>
    </>
  );
});

StageMenu.displayName = 'StageMenu';

const LeadCard = memo<LeadCardProps>(({ lead, isClosed, onStageChange, onWhatsAppClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white p-2 md:p-4 rounded-md border border-neutral-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-black hover:shadow-md transition-all group relative">
      <div className="font-bold text-[11px] md:text-[13px] text-black mb-0.5">{lead.name}</div>
      <div className="text-[9px] md:text-[10px] text-neutral-500 font-semibold mb-2 md:mb-3">{lead.niche}</div>

      {lead.whatsapp && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[9px] md:text-[10px] text-neutral-600">{lead.whatsapp}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onWhatsAppClick?.(lead.name, lead.whatsapp);
            }}
            className="text-[#25D366] hover:text-green-600 transition-colors"
            title="Enviar mensagem via WhatsApp"
          >
            <MessageCircle size={12} className="md:w-3.5 md:h-3.5" />
          </button>
        </div>
      )}

      {isClosed && (
        <div className="pt-2 md:pt-3 border-t border-neutral-100 mt-2 md:mt-3">
          <div className="flex justify-between items-center gap-2">
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[8px] text-neutral-400 font-bold uppercase tracking-[0.1em]">Valor</span>
              <span className="text-[10px] md:text-xs font-black text-black mt-0.5">{lead.value || 'R$ 0,00'}</span>
            </div>
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] md:text-[10px] font-bold flex-shrink-0">
              ✓
            </div>
          </div>
        </div>
      )}

      {!isClosed && (
        <div className="flex justify-end relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="w-6 h-6 rounded-full bg-neutral-50 flex items-center justify-center text-[10px] font-bold text-neutral-400 group-hover:bg-black group-hover:text-white transition-colors cursor-pointer"
            title="Mover lead para outro estágio"
          >
            <ChevronDown size={12} />
          </button>
          {menuOpen && (
            <StageMenu
              lead={lead}
              onSelect={(stage) => {
                onStageChange(lead.id, stage);
                setMenuOpen(false);
              }}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
});

LeadCard.displayName = 'LeadCard';

interface ColumnProps {
  stage: Stage;
  children: React.ReactNode;
  count: number;
  totalValue: number;
}

const Column = memo<ColumnProps>(({ stage, children, count, totalValue }) => {
  const config = STAGE_CONFIG[stage];

  return (
    <div className="bg-neutral-50/50 border-2 border-transparent rounded-md w-[300px] shrink-0 flex flex-col max-h-full transition-colors">
      <div className="bg-neutral-50 border-b border-neutral-200 rounded-t-xl">
        <div className="p-5 border-b border-neutral-200 bg-white rounded-t-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-black text-black uppercase tracking-widest">{stage}</h3>
            <span className="text-[10px] font-bold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-md">
              {count}
            </span>
          </div>

          {config.isClosed ? (
            <div className="flex flex-col">
              <span className="text-lg font-black text-black tracking-tight">{formatCurrency(totalValue)}</span>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Faturamento Real</span>
            </div>
          ) : (
            <div className="h-[38px] flex items-center">
              <div className="h-1.5 w-12 bg-neutral-100 rounded-full" />
            </div>
          )}
        </div>

        <div className="p-3 space-y-3 overflow-y-auto min-h-[200px]">
          {children}
          {count === 0 && (
            <div className="py-12 border-2 border-dashed border-neutral-200 rounded-md flex flex-col items-center justify-center opacity-40">
              <div className="w-8 h-8 rounded-full bg-neutral-100 mb-2" />
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Sem leads</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Column.displayName = 'Column';

// =============================================================================
// Helpers
// =============================================================================

function isDateInRange(lead: Lead, dateFilter: string | undefined): boolean {
  if (!dateFilter) return true;
  if (!lead.firstContact) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const leadDate = new Date(lead.firstContact);

  switch (dateFilter) {
    case 'today':
      return leadDate.toDateString() === today.toDateString();
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return leadDate >= weekAgo;
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return leadDate >= monthAgo;
    }
    default:
      return true;
  }
}

function applyFilters(
  leads: Lead[],
  filters: { stages?: string[]; niches?: string[]; dateFilter?: string },
  searchTerm: string,
): Lead[] {
  const { stages, niches, dateFilter } = filters;

  return leads.filter((lead) => {
    if (stages && stages.length > 0 && !stages.includes(lead.stage)) return false;
    if (niches && niches.length > 0 && !niches.includes(lead.niche)) return false;
    if (!isDateInRange(lead, dateFilter)) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(term) ||
        lead.niche?.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term)
      );
    }

    return true;
  });
}

function searchLeads(leads: Lead[], stage: Stage, searchTerm: string): Lead[] {
  if (!searchTerm) return leads.filter((l) => l.stage === stage);

  const term = searchTerm.toLowerCase();
  return leads.filter(
    (l) =>
      l.stage === stage &&
      (l.name?.toLowerCase().includes(term) ||
        l.niche?.toLowerCase().includes(term) ||
        l.email?.toLowerCase().includes(term)),
  );
}

// =============================================================================
// Page Component
// =============================================================================

const CRMPipeline = () => {
  const { leads, updateLead } = useCRM();
  const { filters, hasActiveFilters } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<{ name: string; phone: string } | null>(null);

  const updateLeadRef = useRef(updateLead);
  useEffect(() => { updateLeadRef.current = updateLead; }, [updateLead]);

  const filteredLeads = useMemo(() => {
    return applyFilters(leads || [], filters, '');
  }, [leads, filters]);

  const handleStageChange = useCallback(
    (leadId: string, newStage: Stage) => {
      updateLeadRef.current(leadId, { stage: newStage })
        .then(() => {
          console.log(`[Pipeline] Lead ${leadId} movido para "${newStage}"`);
        })
        .catch((err: unknown) => {
          console.error('[Pipeline] Erro ao mover lead:', err);
        });
    },
    [],
  );

  const columnData = useMemo(() => {
    return STAGES.map((stage) => {
      const stageLeads = searchLeads(filteredLeads, stage, searchTerm);
      const totalValue = calculateTotalValue(stageLeads);
      return {
        stage,
        leads: stageLeads,
        count: stageLeads.length,
        totalValue,
      };
    });
  }, [filteredLeads, searchTerm]);

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
          <p className="text-neutral-500 text-sm">Visualize o progresso das suas oportunidades. Clique na seta em um card para mover entre etapas.</p>
        </div>
        <div className="relative group">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg border transition-all relative ${hasActiveFilters ? 'bg-neutral-100 text-black border-neutral-200' : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
          >
            <Filter size={16} strokeWidth={hasActiveFilters ? 2.5 : 1.5} />
            {hasActiveFilters && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Filtros
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex gap-5 min-w-max h-full items-start">
          {columnData.map(({ stage, leads: columnLeads, count, totalValue }) => (
            <Column key={stage} stage={stage} count={count} totalValue={totalValue}>
              {columnLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isClosed={STAGE_CONFIG[stage].isClosed}
                  onStageChange={handleStageChange}
                  onWhatsAppClick={(name, phone) => setWhatsAppTarget({ name, phone })}
                />
              ))}
            </Column>
          ))}
        </div>
      </div>

      {whatsAppTarget && (
        <WhatsAppModal
          isOpen={true}
          onClose={() => setWhatsAppTarget(null)}
          leadName={whatsAppTarget.name}
          leadPhone={whatsAppTarget.phone}
        />
      )}
    </div>
  );
};

export default CRMPipeline;
