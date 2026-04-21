import { Users, Calendar, MessageSquare, Clock, UserX, CheckCircle } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

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

const CRMDashboard = () => {
  const { leads, getLeadsByStage } = useCRM();

  const chartData = STAGES.map(stage => ({
    name: stage,
    value: getLeadsByStage(stage).length
  }));

  const stats = [
    { title: 'Total de Leads', value: leads.length.toString(), icon: Users },
    { title: 'Reuniões', value: getLeadsByStage('Reunião Agendada').length.toString(), icon: Calendar },
    { title: 'Contatos Ativos', value: getLeadsByStage('Contato Ativo').length.toString(), icon: MessageSquare },
    { title: 'Follow-ups', value: getLeadsByStage('Follow Up').length.toString(), icon: Clock },
    { title: 'Leads Perdidos', value: getLeadsByStage('Perdido').length.toString(), icon: UserX },
    { title: 'Fechados', value: getLeadsByStage('Contrato Fechado').length.toString(), icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header section */}
      <div className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-4xl font-black text-black tracking-tight mb-2 whitespace-nowrap">Painel de Vendas</h1>
        <p className="text-neutral-500 text-xs md:text-sm">Monitoramento em tempo real do seu funil de vendas.</p>
      </div>

      {/* 6 Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3 lg:gap-4 mb-6 md:mb-10">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 md:p-5 hover:border-black transition-all shadow-sm">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-6 md:w-8 h-6 md:h-8 rounded-lg bg-slate-100 flex items-center justify-center">
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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-8 shadow-sm overflow-x-auto">
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
    </div>
  );
};

export default CRMDashboard;
