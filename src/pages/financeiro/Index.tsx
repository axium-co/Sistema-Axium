import { useState, useEffect, useCallback } from 'react';
import { useCRM } from '../../contexts/CRMContext';
import { Plus, Pencil, Save, X, TrendingUp, TrendingDown, DollarSign, PieChart, CreditCard, User, Calendar, CheckCircle2, Clock, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

interface Invoice {
  id: string;
  client: string;
  amount: string;
  date: string;
  status: 'Pago' | 'Pendente' | 'Cancelado' | 'Vencida';
  source?: 'manual' | 'lead' | 'asaas';
}

const Financeiro = () => {
  const { leads, getTotalValueByStage } = useCRM();
  
  // Financial State
  const [expenses, setExpenses] = useState(42500);
  const [manualInvoices, setManualInvoices] = useState<Invoice[]>([]);
  const [asaasInvoices, setAsaasInvoices] = useState<Invoice[]>([]);
  
  // Integration State
  const [isAsaasConnected, setIsAsaasConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  // UI State
  const [editingCard, setEditingCard] = useState<{ label: string; value: number } | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isNewInvoice, setIsNewInvoice] = useState(false);

  // Persistence & Initial Load
  useEffect(() => {
    const stored = localStorage.getItem('axium_finance_v1');
    const asaasConnected = localStorage.getItem('axium_int_asaas') === 'true';
    setIsAsaasConnected(asaasConnected);

    if (stored) {
      const parsed = JSON.parse(stored);
      setExpenses(parsed.expenses ?? 42500);
      setManualInvoices(parsed.manualInvoices ?? []);
    }
    
    if (asaasConnected) {
      syncAsaasData();
    }
  }, []);

  const syncAsaasData = useCallback(async () => {
    setIsSyncing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Asaas Data (Cobranças)
    const mockAsaas: Invoice[] = [
      { id: 'PAY-827364', client: 'Clínica Sorriso', amount: 'R$ 15.000,00', date: '2026-04-20', status: 'Pago', source: 'asaas' },
      { id: 'PAY-918273', client: 'João Silva', amount: 'R$ 5.000,00', date: '2026-04-21', status: 'Pago', source: 'asaas' },
      { id: 'PAY-102938', client: 'Maria Santos', amount: 'R$ 8.000,00', date: '2026-04-25', status: 'Pendente', source: 'asaas' },
      { id: 'PAY-445566', client: 'Pedro Oliveira', amount: 'R$ 12.000,00', date: '2026-04-15', status: 'Vencida', source: 'asaas' },
      { id: 'PAY-778899', client: 'Odonto Master', amount: 'R$ 22.500,00', date: '2026-04-18', status: 'Pago', source: 'asaas' },
    ];

    setAsaasInvoices(mockAsaas);
    setLastSync(new Date().toLocaleTimeString());
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('axium_finance_v1', JSON.stringify({
      expenses,
      manualInvoices
    }));
  }, [expenses, manualInvoices]);

  // Calculations
  const parseBRL = (val: string) => {
    const clean = val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(clean) || 0;
  };

  const asaasRevenue = asaasInvoices
    .filter(inv => inv.status === 'Pago')
    .reduce((acc, inv) => acc + parseBRL(inv.amount), 0);

  const asaasPending = asaasInvoices
    .filter(inv => inv.status === 'Pendente')
    .reduce((acc, inv) => acc + parseBRL(inv.amount), 0);

  const leadRevenue = getTotalValueByStage('Contrato Fechado');
  
  // Final metrics
  const totalRevenue = isAsaasConnected ? asaasRevenue : leadRevenue;
  const pendingRevenue = isAsaasConnected ? asaasPending : 18900;
  const netProfit = totalRevenue - expenses;

  // Combine invoices
  const leadInvoices: Invoice[] = leads
    .filter(l => l.stage === 'Contrato Fechado')
    .map(l => ({
      id: `lead-${l.id}`,
      client: l.name,
      amount: l.value || 'R$ 0,00',
      date: l.closingDate || '—',
      status: 'Pago',
      source: 'lead'
    }));

  const allInvoices = [...asaasInvoices, ...manualInvoices, ...leadInvoices].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSaveCardEdit = (newValue: number) => {
    if (editingCard?.label === 'Despesas') setExpenses(newValue);
    setEditingCard(null);
  };

  const handleOpenInvoiceModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setIsNewInvoice(false);
    } else {
      setEditingInvoice({
        id: Math.random().toString(36).substring(2, 9),
        client: '',
        amount: 'R$ 0,00',
        date: new Date().toISOString().split('T')[0],
        status: 'Pendente',
        source: 'manual'
      });
      setIsNewInvoice(true);
    }
    setIsInvoiceModalOpen(true);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    if (isNewInvoice) {
      setManualInvoices(prev => [editingInvoice, ...prev]);
    } else {
      if (editingInvoice.source === 'lead') {
        alert('Faturas vinculadas a leads devem ser editadas no módulo de Leads.');
      } else if (editingInvoice.source === 'asaas') {
        alert('Faturas do Asaas são sincronizadas automaticamente e não podem ser editadas manualmente.');
      } else {
        setManualInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? editingInvoice : inv));
      }
    }
    setIsInvoiceModalOpen(false);
  };

  const handleDeleteInvoice = (id: string) => {
    const inv = allInvoices.find(i => i.id === id);
    if (inv?.source !== 'manual') {
      alert('Apenas faturas manuais podem ser excluídas por aqui.');
      return;
    }
    if (confirm('Excluir esta fatura manual?')) {
      setManualInvoices(prev => prev.filter(inv => inv.id !== id));
      setIsInvoiceModalOpen(false);
    }
  };

  const statusStyle: Record<string, string> = {
    Pago: 'bg-emerald-50 text-emerald-700 font-black uppercase tracking-widest',
    Pendente: 'bg-amber-50 text-amber-600 font-black uppercase tracking-widest',
    Vencida: 'bg-red-50 text-red-600 font-black uppercase tracking-widest',
    Cancelado: 'bg-neutral-50 text-neutral-300 font-black uppercase tracking-widest',
  };

  return (
    <div className="min-h-screen">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-black tracking-tight">Financeiro</h1>
            {isAsaasConnected && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full animate-in fade-in slide-in-from-left-2 duration-500">
                <CheckCircle2 size={10} strokeWidth={3} />
                Asaas Conectado
              </span>
            )}
          </div>
          <p className="text-neutral-500 text-sm font-medium">Controle de receitas, despesas e fluxo de caixa.</p>
        </div>
        
        <div className="flex gap-3">
          {isAsaasConnected && (
            <button 
              onClick={syncAsaasData}
              disabled={isSyncing}
              className="px-4 py-3 rounded-xl border border-neutral-200 text-neutral-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:border-black hover:text-black transition-all active:scale-[0.98] bg-white"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Sincronizando...' : 'Atualizar Dados'}
            </button>
          )}
          <button 
            onClick={() => handleOpenInvoiceModal()}
            className="bg-black text-white px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus size={16} strokeWidth={3} />
            Nova Fatura
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Receita Total', value: totalRevenue, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', readonly: isAsaasConnected },
          { label: 'Despesas', value: expenses, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Lucro Líquido', value: netProfit, icon: PieChart, color: 'text-black', bg: 'bg-neutral-100', readonly: true },
          { label: 'Faturamento Pendente', value: pendingRevenue, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', readonly: isAsaasConnected },
        ].map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => !card.readonly && setEditingCard({ label: card.label, value: card.value })}
            className={`bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm transition-all group ${!card.readonly ? 'cursor-pointer hover:border-black hover:shadow-md' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon size={18} strokeWidth={2.5} />
              </div>
              {!card.readonly && (
                <Pencil size={12} className="text-neutral-300 group-hover:text-black transition-colors" />
              )}
              {card.readonly && isAsaasConnected && (card.label.includes('Receita') || card.label.includes('Faturamento')) && (
                <div className="p-1 bg-emerald-50 text-emerald-500 rounded-md" title="Sincronizado com Asaas">
                  <RefreshCw size={10} strokeWidth={3} />
                </div>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-2xl font-black text-black tracking-tight">{formatCurrency(card.value)}</p>
            {card.label === 'Receita Total' && isAsaasConnected && (
              <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-2 flex items-center gap-1">
                <CheckCircle2 size={10} />
                Confirmado no Asaas
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-neutral-100 flex items-center justify-center">
              <CreditCard size={14} className="text-black" />
            </div>
            <div>
              <h2 className="text-[11px] font-black text-black uppercase tracking-widest">Faturas Recentes</h2>
              {lastSync && <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter mt-0.5">Última sincronização: {lastSync}</p>}
            </div>
          </div>
          {isAsaasConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-xs">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-black uppercase tracking-widest">Live: Asaas API</span>
            </div>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              <th className="px-8 py-4 text-left text-[10px] text-neutral-400 font-black uppercase tracking-wider">Cliente / Descrição</th>
              <th className="px-8 py-4 text-left text-[10px] text-neutral-400 font-black uppercase tracking-wider">Data / Vencimento</th>
              <th className="px-8 py-4 text-right text-[10px] text-neutral-400 font-black uppercase tracking-wider">Valor</th>
              <th className="px-8 py-4 text-center text-[10px] text-neutral-400 font-black uppercase tracking-wider">Status</th>
              <th className="px-8 py-4 text-center text-[10px] text-neutral-400 font-black uppercase tracking-wider">Origem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {allInvoices.map((invoice) => (
              <tr 
                key={invoice.id} 
                onClick={() => handleOpenInvoiceModal(invoice)}
                className="hover:bg-neutral-50 transition-colors group cursor-pointer"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase transition-all ${
                      invoice.source === 'asaas' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400 group-hover:bg-black group-hover:text-white'
                    }`}>
                      {invoice.client.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-black text-black group-hover:underline">{invoice.client}</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">ID: {invoice.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-neutral-500 font-bold">{invoice.date}</td>
                <td className="px-8 py-5 text-right font-black text-black">{invoice.amount}</td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-3 py-1 rounded-lg text-[9px] ${statusStyle[invoice.status]}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  {invoice.source === 'asaas' ? (
                    <div className="flex items-center justify-center" title="Asaas Gateway">
                      <ExternalLink size={14} className="text-emerald-500" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center" title="Sistema Interno">
                      <Save size={14} className="text-neutral-300" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {allInvoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-neutral-400 font-bold uppercase tracking-widest italic opacity-50">
                  Nenhuma fatura registrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Metric Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-black tracking-tight">Editar {editingCard.label}</h3>
              <button onClick={() => setEditingCard(null)} className="text-neutral-400 hover:text-black transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8">
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[2px] mb-3">Novo Valor (BRL)</label>
              <div className="relative flex items-center">
                <DollarSign className="absolute left-4 text-neutral-400" size={16} />
                <input
                  type="number"
                  autoFocus
                  value={editingCard.value}
                  onChange={(e) => setEditingCard({ ...editingCard, value: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-10 pr-4 py-4 text-xl font-black text-black focus:ring-1 focus:ring-black outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-neutral-400 font-bold mt-4 italic">Isso irá sobrescrever os valores automáticos do sistema.</p>
            </div>
            <div className="px-8 py-6 bg-neutral-50 flex gap-3">
              <button onClick={() => setEditingCard(null)} className="flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-neutral-400">Cancelar</button>
              <button 
                onClick={() => handleSaveCardEdit(editingCard.value)}
                className="flex-[2] bg-black text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-all"
              >
                Salvar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {isInvoiceModalOpen && editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300">
            <form onSubmit={handleSaveInvoice}>
              <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-black tracking-tight">
                  {isNewInvoice ? 'Nova Fatura Manual' : 'Editar Fatura'}
                </h3>
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="text-neutral-400 hover:text-black transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                    <User size={12} strokeWidth={3} />
                    Cliente / Descrição
                  </label>
                  <input
                    required
                    disabled={editingInvoice.source === 'asaas'}
                    type="text"
                    value={editingInvoice.client}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, client: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-black text-black focus:ring-1 focus:ring-black outline-none transition-all disabled:opacity-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                      <Calendar size={12} strokeWidth={3} />
                      Data
                    </label>
                    <input
                      required
                      disabled={editingInvoice.source === 'asaas'}
                      type="date"
                      value={editingInvoice.date}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-black text-black focus:ring-1 focus:ring-black outline-none transition-all [color-scheme:light] disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                      <DollarSign size={12} strokeWidth={3} />
                      Valor
                    </label>
                    <input
                      required
                      disabled={editingInvoice.source === 'asaas'}
                      type="text"
                      value={editingInvoice.amount}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-black text-black focus:ring-1 focus:ring-black outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                    <CheckCircle2 size={12} strokeWidth={3} />
                    Status
                  </label>
                  <select
                    disabled={editingInvoice.source === 'asaas'}
                    value={editingInvoice.status}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value as any })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-black text-black focus:ring-1 focus:ring-black outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Vencida">Vencida</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                {editingInvoice.source === 'asaas' && (
                  <div className="p-4 bg-emerald-50 rounded-2xl flex gap-3 items-center">
                    <AlertTriangle size={16} className="text-emerald-600" />
                    <p className="text-[10px] text-emerald-700 font-bold leading-tight">
                      Esta fatura é gerenciada pelo Asaas. Alterações devem ser feitas diretamente no painel do gateway.
                    </p>
                  </div>
                )}
              </div>
              <div className="px-8 py-6 bg-neutral-50 flex justify-between gap-3">
                <div className="flex gap-3">
                  {!isNewInvoice && editingInvoice.source === 'manual' && (
                    <button 
                      type="button"
                      onClick={() => handleDeleteInvoice(editingInvoice.id)}
                      className="px-4 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  )}
                </div>
                <div className="flex gap-3 flex-1">
                  <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-neutral-400">Cancelar</button>
                  <button 
                    type="submit" 
                    disabled={editingInvoice.source === 'asaas'}
                    className="flex-[2] bg-black text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isNewInvoice ? 'Criar Fatura' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financeiro;
