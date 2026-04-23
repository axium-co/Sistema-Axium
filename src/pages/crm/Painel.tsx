import { useEffect, useState } from 'react';
import { Users, Calendar, MessageSquare, Clock, UserX, CheckCircle, UserPlus, ArrowRight, CheckSquare, Activity, AlertCircle, FileText, Filter, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { supabase, ACTIVITY_LOGS_TABLE } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFilters } from '../../contexts/FilterContext';

interface ActivityLog {
  id: string;
  acao: 'lead_criado' | 'lead_movido' | 'tarefa_concluida' | 'lead_atualizado';
  descricao: string;
  timestamp: string;
}

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

const ACTION_ICONS = {
  lead_criado: UserPlus,
  lead_movido: ArrowRight,
  lead_atualizado: ArrowRight,
  tarefa_concluida: CheckSquare,
};

const CRMDashboard = () => {
  const { leads, getLeadsByStage } = useCRM();
  const { filters, hasActiveFilters } = useFilters();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [fetchActivityLogsError, setFetchActivityLogsError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredLeads = filters.stages.length > 0 || filters.niches.length > 0 || filters.dateFilter !== ''
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

  useEffect(() => {
    if (!loaded) {
      const fetchActivityLogs = async () => {
        setIsLoadingLogs(true);
        setFetchActivityLogsError(null);
        
        const timeoutId = setTimeout(() => {
          setFetchActivityLogsError('Tempo limite excedido (5s). Verifique sua conexão.');
          setIsLoadingLogs(false);
        }, 5000);

        try {
          const { data, error } = await supabase
            .from(ACTIVITY_LOGS_TABLE)
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(15);
          
          clearTimeout(timeoutId);
          
          if (error) {
            console.error('Erro ao buscar logs de atividade:', error);
            setFetchActivityLogsError('Erro ao carregar atividades.');
            return;
          }
          setActivityLogs(data || []);
        } catch (err) {
          clearTimeout(timeoutId);
          console.error('Erro ao buscar logs de atividade:', err);
          setFetchActivityLogsError('Erro ao carregar atividades.');
        } finally {
          setIsLoadingLogs(false);
        }
      };
      
      fetchActivityLogs(15);
      setLoaded(true);
    }
  }, [loaded]);

  const chartData = STAGES.map(stage => ({
    name: stage,
    value: filteredLeads.filter(l => l.stage === stage).length
  }));

  const stats = [
    { title: 'Total de Leads', value: filteredLeads.length.toString(), icon: Users },
    { title: 'Reuniões', value: filteredLeads.filter(l => l.stage === 'Reunião Agendada').length.toString(), icon: Calendar },
    { title: 'Contatos Ativos', value: filteredLeads.filter(l => l.stage === 'Contato Ativo').length.toString(), icon: MessageSquare },
    { title: 'Follow-ups', value: filteredLeads.filter(l => l.stage === 'Follow Up').length.toString(), icon: Clock },
    { title: 'Propostas Enviadas', value: filteredLeads.filter(l => l.stage === 'Proposta Enviada').length.toString(), icon: FileText },
    { title: 'Leads Perdidos', value: filteredLeads.filter(l => l.stage === 'Perdido').length.toString(), icon: UserX },
    { title: 'Fechados', value: filteredLeads.filter(l => l.stage === 'Contrato Fechado').length.toString(), icon: CheckCircle },
  ];

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return 'agora';
    if (diff < 60) return `${diff}min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  return (
    <div className="relative min-h-screen bg-white">
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

      {/* Header section */}
      <div className="mb-4 md:mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-black tracking-tight mb-2 whitespace-nowrap">Painel de Vendas</h1>
          <p className="text-neutral-500 text-xs md:text-sm">Monitoramento em tempo real do seu funil de vendas.</p>
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

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3 lg:gap-4 mb-6 md:mb-10">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-md p-3 md:p-5 hover:border-black transition-all shadow-sm">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-6 md:w-8 h-6 md:h-8 rounded-md bg-slate-100 flex items-center justify-center">
                  <Icon size={14} className="text-black md:w-4 md:h-4" />
                </div>
                <p className="text-slate-500 text-[9px] md:text-[11px] font-bold uppercase tracking-widest leading-none">{stat.title}</p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-black">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-8 shadow-sm overflow-x-auto mb-6 md:mb-10">
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-black mb-1">Visão Geral do Pipeline</h2>
          <p className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-widest">Distribuição de leads por etapa</p>
        </div>
        
        <div className="h-[280px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#000" 
                fontSize={10} 
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                dy={8}
                dx={5}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  color: '#000',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#000" 
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-4 h-4 text-black" />
          <h2 className="text-lg md:text-xl font-bold text-black">Atividades Recentes</h2>
        </div>
        {isLoadingLogs ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            <span className="ml-2 text-sm text-neutral-500">Carregando atividades...</span>
          </div>
        ) : fetchActivityLogsError ? (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600">{fetchActivityLogsError}</p>
          </div>
        ) : activityLogs.length === 0 ? (
          <p className="text-slate-400 text-xs">Nenhuma atividade registrada.</p>
        ) : (
          <div className="space-y-3">
            {activityLogs.slice(0, 10).map((log) => {
              const Icon = ACTION_ICONS[log.acao] || Activity;
              return (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-black" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-black leading-snug">{log.descricao}</p>
                    <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-0.5">há {formatTime(log.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMDashboard;
