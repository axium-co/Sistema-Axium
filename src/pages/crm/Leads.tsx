import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import type { Lead } from '../../contexts/CRMContext';

const formatBRL = (val: string) => {
  const numeric = val.replace(/\D/g, '');
  if (!numeric) return '';
  const num = parseFloat(numeric) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
};

const EMPTY_LEAD: Partial<Lead> = {
  name: '', niche: '', whatsapp: '', email: '', instagram: '',
  stage: 'Novos Leads', firstContact: '', closingDate: '',
  followUpReminder: '', address: '', gmnReviews: '', gmnStars: '',
  notes: '', value: '',
};

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

const stageStyle: Record<string, string> = {
  'Novos Leads':      'bg-neutral-100 text-neutral-600',
  'Primeiro Contato': 'bg-neutral-200 text-neutral-700',
  'Contato Ativo':    'bg-slate-100 text-slate-700',
  'Reunião Agendada': 'bg-black text-white',
  'Follow Up':        'bg-slate-800 text-white',
  'Proposta Enviada': 'bg-zinc-100 text-zinc-700',
  'Contrato Fechado': 'bg-emerald-100 text-emerald-700',
  'Perdido':          'bg-red-50 text-red-600',
};

/* ── Reusable white-modal field components ── */
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
      {label}{required && <span className="text-black ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3.5 text-black text-sm placeholder-slate-300 focus:outline-none focus:border-black transition-colors';

const CRMLeads = () => {
  const { leads, addLead, updateLead, deleteLead, searchTerm } = useCRM();

  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Lead>>(EMPTY_LEAD);
  const [mode, setMode] = useState<'add' | 'edit'>('add');

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => { setMode('add'); setCurrent(EMPTY_LEAD); setIsOpen(true); };
  const openEdit = (lead: Lead) => { setMode('edit'); setCurrent({ ...lead }); setIsOpen(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'add') {
      addLead(current as Omit<Lead, 'id'>);
    } else {
      updateLead(current.id!, current);
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir este lead?')) deleteLead(id);
  };

  const set = (field: keyof Lead, val: string) =>
    setCurrent(prev => ({ ...prev, [field]: val }));

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mb-1">Leads</h1>
          <p className="text-neutral-500 text-xs md:text-sm">Gerenciamento de contatos e funil de vendas.</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={15} strokeWidth={2.5} />
          <span className="hidden sm:inline">Novo Lead</span>
          <span className="sm:hidden text-xs">Novo</span>
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {['Nome / Nicho', 'WhatsApp', 'Instagram', 'GMN ⭐', 'Valor', 'Etapa', 'Ações'].map(h => (
                <th key={h} className="px-3 md:px-5 py-2 md:py-3.5 text-left text-[10px] md:text-[11px] text-neutral-400 font-semibold uppercase tracking-wider last:text-center whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-neutral-50 transition-colors group">
                <td className="px-3 md:px-5 py-2 md:py-4">
                  <div className="font-semibold text-black text-xs md:text-sm">{lead.name}</div>
                  <div className="text-[10px] md:text-xs text-neutral-400 truncate">{lead.niche} · {lead.email}</div>
                </td>
                <td className="px-3 md:px-5 py-2 md:py-4 text-neutral-600 text-xs md:text-sm whitespace-nowrap">{lead.whatsapp}</td>
                <td className="px-3 md:px-5 py-2 md:py-4 text-neutral-600 text-xs md:text-sm whitespace-nowrap">{lead.instagram}</td>
                <td className="px-3 md:px-5 py-2 md:py-4">
                  <div className="text-black font-semibold text-xs md:text-sm">{lead.gmnStars} ★</div>
                  <div className="text-[10px] md:text-xs text-neutral-400">{lead.gmnReviews} avaliações</div>
                </td>
                <td className="px-3 md:px-5 py-2 md:py-4 text-black font-medium text-xs md:text-sm whitespace-nowrap">{lead.value || '—'}</td>
                <td className="px-3 md:px-5 py-2 md:py-4">
                  <span className={`px-2 md:px-2.5 py-1 rounded-md text-[10px] md:text-[11px] font-semibold ${stageStyle[lead.stage] ?? 'bg-neutral-100 text-neutral-600'}`}>
                    {lead.stage}
                  </span>
                </td>
                <td className="px-3 md:px-5 py-2 md:py-4">
                  <div className="flex items-center justify-center gap-0.5 md:gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(lead)} className="p-1 md:p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-md transition-all">
                      <Pencil size={12} className="md:w-3.5 md:h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(lead.id)} className="p-1 md:p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
                      <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 md:px-5 py-8 md:py-12 text-center text-neutral-400 font-medium italic text-xs md:text-sm">
                  Nenhum lead encontrado para "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════ WHITE MODAL ══════════════════════ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-sm md:max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal header */}
            <div className="flex justify-between items-start md:items-center gap-3 px-4 md:px-7 py-3 md:py-5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg md:text-xl font-black text-black tracking-tight">
                  {mode === 'add' ? 'Novo Lead' : 'Editar Lead'}
                </h2>
                <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-0.5">
                  {mode === 'add' ? 'Preencha os dados para cadastrar um novo lead.' : `Editando: ${current.name}`}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-black transition-colors p-1 flex-shrink-0" type="button">
                <X size={20} className="w-5 h-5 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleSave} className="overflow-y-auto flex-1">
              <div className="px-4 md:px-7 py-4 md:py-6 space-y-3 md:space-y-5">

                {/* Row 1: Nome + Nicho */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <Field label="Nome" required>
                    <input type="text" value={current.name} onChange={e => set('name', e.target.value)}
                      required className={inputCls} placeholder="Ex: João Silva" />
                  </Field>
                  <Field label="Nicho">
                    <input type="text" value={current.niche} onChange={e => set('niche', e.target.value)}
                      className={inputCls} placeholder="Ex: Odontologia" />
                  </Field>
                </div>

                {/* Row 2: WhatsApp + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <Field label="WhatsApp">
                    <input type="text" value={current.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                      className={inputCls} placeholder="(11) 99999-9999" />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={current.email} onChange={e => set('email', e.target.value)}
                      className={inputCls} placeholder="email@dominio.com" />
                  </Field>
                </div>

                {/* Row 3: Instagram + Etapa do Pipeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <Field label="Instagram">
                    <input type="text" value={current.instagram} onChange={e => set('instagram', e.target.value)}
                      className={inputCls} placeholder="@usuario" />
                  </Field>
                  <Field label="Etapa do Pipeline">
                    <select value={current.stage} onChange={e => set('stage', e.target.value)}
                      className={`${inputCls} appearance-none cursor-pointer`}>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Row 4: Primeiro Contato + Data de Fechamento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <Field label="Primeiro Contato">
                    <input type="date" value={current.firstContact} onChange={e => set('firstContact', e.target.value)}
                      className={`${inputCls} [color-scheme:light]`} />
                  </Field>
                  <Field label="Data de Fechamento">
                    <input type="date" value={current.closingDate} onChange={e => set('closingDate', e.target.value)}
                      className={`${inputCls} [color-scheme:light]`} />
                  </Field>
                </div>

                {/* Row 5: Lembrete de Follow-up + Valor do Contrato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <Field label="Lembrete de Follow-up">
                    <input type="date" value={current.followUpReminder} onChange={e => set('followUpReminder', e.target.value)}
                      className={`${inputCls} [color-scheme:light]`} />
                  </Field>
                  <Field label="Valor do Contrato">
                    <input 
                      type="text" 
                      value={current.value} 
                      onChange={e => set('value', formatBRL(e.target.value))}
                      className={inputCls} 
                      placeholder="R$ 0,00" 
                    />
                  </Field>
                </div>

                {/* Row 6: Endereço (full width) */}
                <Field label="Endereço / Localização">
                  <input type="text" value={current.address} onChange={e => set('address', e.target.value)}
                    className={inputCls} placeholder="Ex: São Paulo - SP" />
                </Field>

                {/* Row 7: GMN Reviews + GMN Stars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <Field label="Quantidade de Avaliações GMN">
                    <input type="number" min="0" value={current.gmnReviews} onChange={e => set('gmnReviews', e.target.value)}
                      className={inputCls} placeholder="Ex: 248" />
                  </Field>
                  <Field label="Média de Estrelas GMN">
                    <input type="number" min="0" max="5" step="0.1" value={current.gmnStars} onChange={e => set('gmnStars', e.target.value)}
                      className={inputCls} placeholder="Ex: 4.7" />
                  </Field>
                </div>

                {/* Row 8: Observações */}
                <Field label="Observações">
                  <textarea value={current.notes} onChange={e => set('notes', e.target.value)}
                    rows={4} className={`${inputCls} resize-none`}
                    placeholder="Notas internas, contexto do lead..." />
                </Field>

              </div>

              {/* Sticky footer buttons */}
              <div className="flex flex-col md:flex-row gap-2 md:gap-3 px-4 md:px-7 py-3 md:py-5 border-t border-slate-100 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 md:py-3 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors text-xs md:text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-4 py-2 md:py-3 rounded-lg font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all text-xs md:text-sm"
                >
                  <Save size={15} strokeWidth={2.5} />
                  {mode === 'add' ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMLeads;
