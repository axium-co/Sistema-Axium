import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Copy, ArrowUp, ArrowDown,
  X, Save, CheckCircle2, AlertCircle, Eye, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useWhatsAppTemplates } from '../../contexts/WhatsAppTemplatesContext';
import { replaceTemplateVariables, COMPANY_NAME, VARIABLES_LIST } from '../../lib/whatsapp';
import { useAuth } from '../../contexts/AuthContext';
import type { WhatsAppTemplate } from '../../lib/whatsapp';
import { useNavigate } from 'react-router-dom';

type ModalMode = 'add' | 'edit' | null;

const emptyForm = { name: '', message: '', active: true };

const WhatsAppTemplatesPage = () => {
  const navigate = useNavigate();
  const { templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, reorderTemplate, toggleTemplateActive } = useWhatsAppTemplates();
  const { employeeName } = useAuth();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; message: string; active: boolean }>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.order - b.order),
    [templates]
  );

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const openAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData(emptyForm);
    setErrorMessage('');
  };

  const openEdit = (t: WhatsAppTemplate) => {
    setModalMode('edit');
    setEditingId(t.id);
    setFormData({ name: t.name, message: t.message, active: t.active });
    setErrorMessage('');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setFormData(emptyForm);
    setErrorMessage('');
  };

  const insertVariable = (varKey: string) => {
    setFormData(prev => ({ ...prev, message: prev.message + `{${varKey}}` }));
  };

  const previewVariables = useMemo(() => ({
    nome: 'João Silva',
    evento: 'Casamento',
    data_evento: '15/12/2026',
    valor: 'R$ 5.000,00',
    responsavel: employeeName || 'Maria',
    empresa: COMPANY_NAME,
  }), [employeeName]);

  const livePreview = useMemo(
    () => replaceTemplateVariables(formData.message, previewVariables),
    [formData.message, previewVariables]
  );

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrorMessage('O nome do template é obrigatório.');
      return;
    }
    if (!formData.message.trim()) {
      setErrorMessage('A mensagem do template é obrigatória.');
      return;
    }

    try {
      if (modalMode === 'add') {
        const maxOrder = templates.length > 0 ? Math.max(...templates.map(t => t.order)) : -1;
        await addTemplate({ ...formData, name: formData.name.trim(), message: formData.message.trim(), order: maxOrder + 1 });
        showSuccess('Template criado com sucesso!');
      } else if (modalMode === 'edit' && editingId) {
        await updateTemplate(editingId, { ...formData, name: formData.name.trim(), message: formData.message.trim() });
        showSuccess('Template atualizado com sucesso!');
      }
      closeModal();
    } catch (err) {
      console.error('Erro ao salvar template:', err);
      setErrorMessage('Erro ao salvar template. Tente novamente.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      setDeleteConfirmId(null);
      showSuccess('Template excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir template:', err);
    }
  };

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <button
            type="button"
            onClick={() => navigate('/configuracoes')}
            className="text-xs font-bold text-neutral-400 hover:text-black transition-colors mb-2 block cursor-pointer"
          >
            &larr; Voltar para Configurações
          </button>
          <h1 className="text-4xl font-black text-black tracking-tighter mb-1">Templates de WhatsApp</h1>
          <p className="text-neutral-500 text-sm font-medium">Gerencie as mensagens rápidas para envio via WhatsApp.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-black text-white px-6 py-3 rounded-md font-black text-[11px] uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-[0.95] shadow-lg shadow-black/10 flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          Novo Template
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-medium">
          <CheckCircle2 size={20} />
          {successMessage}
        </div>
      )}

      {sortedTemplates.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center">
          <p className="text-neutral-400 font-bold text-lg mb-2">Nenhum template cadastrado</p>
          <p className="text-neutral-400 text-sm">Clique em "Novo Template" para criar o primeiro.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {sortedTemplates.map((t, index) => (
              <div key={t.id} className="p-6 flex items-center gap-4 hover:bg-neutral-50 transition-colors group">
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => reorderTemplate(t.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-neutral-300 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Mover para cima"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderTemplate(t.id, 'down')}
                    disabled={index === sortedTemplates.length - 1}
                    className="p-1 text-neutral-300 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-black text-sm">{t.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      t.active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {t.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium truncate">
                    {t.message.replace(/[{}]/g, '').substring(0, 80)}...
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-all cursor-pointer"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateTemplate(t.id)}
                    className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-all cursor-pointer"
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTemplateActive(t.id)}
                    className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-all cursor-pointer"
                    title={t.active ? 'Desativar' : 'Ativar'}
                  >
                    {t.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  </button>
                  {deleteConfirmId === t.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-200 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(t.id)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-neutral-200 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500">
            <div className="px-12 py-10 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/30">
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[3px] mb-3 block">
                  Templates de WhatsApp
                </span>
                <h2 className="text-4xl font-black text-black tracking-tighter">
                  {modalMode === 'add' ? 'Novo Template' : 'Editar Template'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-3 hover:bg-white rounded-2xl transition-colors text-neutral-300 hover:text-black border border-transparent hover:border-neutral-200 shadow-sm cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-12 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                  <AlertCircle size={20} />
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">
                  Nome do Template <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all"
                  placeholder="Ex: Saudação inicial, Envio de proposta"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">
                  Mensagem <span className="text-black">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {VARIABLES_LIST.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded-lg text-[10px] font-bold text-neutral-600 hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer"
                      title={v.label}
                    >
                      {'{'}{v.key}{'}'}
                    </button>
                  ))}
                </div>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 font-bold text-black focus:border-black outline-none transition-all resize-none"
                  rows={6}
                  placeholder="Digite a mensagem... use as variáveis acima para personalizar."
                />
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-neutral-400" />
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    Preview em Tempo Real
                  </span>
                </div>
                <div className="bg-white rounded-xl p-4 text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                  {formData.message ? livePreview : <span className="text-neutral-300 italic">Digite a mensagem para ver o preview...</span>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">
                  Status do Template
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    formData.active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  {formData.active ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </div>

            <div className="px-12 py-10 bg-neutral-50 flex gap-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-[2] text-white py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:brightness-90 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3 cursor-pointer"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Save size={18} />
                {modalMode === 'add' ? 'Criar Template' : 'Salvar Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplatesPage;
