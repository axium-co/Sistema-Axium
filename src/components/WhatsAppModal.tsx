import { useState, useEffect, useMemo } from 'react';
import { X, MessageCircle, Edit3, ExternalLink, AlertCircle } from 'lucide-react';
import { useWhatsAppTemplates } from '../contexts/WhatsAppTemplatesContext';
import { useAuth } from '../contexts/AuthContext';
import { cleanPhoneNumber, generateWhatsAppLink, replaceTemplateVariables, COMPANY_NAME } from '../lib/whatsapp';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  leadPhone: string;
  eventName?: string;
  eventDate?: string;
  eventValue?: string;
  onEditLead?: () => void;
}

export default function WhatsAppModal({
  isOpen,
  onClose,
  leadName,
  leadPhone,
  eventName,
  eventDate,
  eventValue,
  onEditLead,
}: WhatsAppModalProps) {
  const { activeTemplates } = useWhatsAppTemplates();
  const { employeeName } = useAuth();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');
  const [openWithoutMessage, setOpenWithoutMessage] = useState(false);

  const cleanedPhone = useMemo(() => cleanPhoneNumber(leadPhone), [leadPhone]);
  const hasPhone = !!leadPhone && !!cleanedPhone;

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    return phone;
  };

  const variables = useMemo(() => ({
    nome: leadName,
    evento: eventName || '[evento]',
    data_evento: eventDate
      ? new Date(eventDate).toLocaleDateString('pt-BR')
      : '[data do evento]',
    valor: eventValue || '[valor]',
    responsavel: employeeName || '[responsavel]',
    empresa: COMPANY_NAME,
  }), [leadName, eventName, eventDate, eventValue, employeeName]);

  const selectedTemplate = useMemo(
    () => activeTemplates.find(t => t.id === selectedTemplateId),
    [activeTemplates, selectedTemplateId]
  );

  const previewMessage = useMemo(() => {
    if (openWithoutMessage) return '';
    if (!selectedTemplate) return '';
    return replaceTemplateVariables(
      isEditing ? editedMessage : selectedTemplate.message,
      variables
    );
  }, [selectedTemplate, variables, isEditing, editedMessage, openWithoutMessage]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateId(null);
      setIsEditing(false);
      setEditedMessage('');
      setOpenWithoutMessage(false);
    }
  }, [isOpen]);

  const handleOpenWhatsApp = () => {
    const url = generateWhatsAppLink(leadPhone, previewMessage || undefined);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleEditToggle = () => {
    if (!isEditing && selectedTemplate) {
      setEditedMessage(selectedTemplate.message);
    }
    setIsEditing(!isEditing);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[3px] mb-1 block">Enviar Mensagem</span>
            <h2 className="text-xl font-black text-black tracking-tight">{leadName}</h2>
            <p className="text-sm text-neutral-500 font-medium mt-0.5">
              {hasPhone ? formatPhone(leadPhone) : 'Nenhum telefone cadastrado'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-300 hover:text-black cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-5">
          {!hasPhone && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">Telefone não cadastrado</p>
                <p className="text-xs text-red-600 font-medium mt-1">
                  Este lead não possui número de WhatsApp cadastrado.
                </p>
                {onEditLead && (
                  <button
                    type="button"
                    onClick={onEditLead}
                    className="mt-2 text-xs font-bold text-red-700 underline hover:text-red-800 cursor-pointer"
                  >
                    Editar cadastro do lead
                  </button>
                )}
              </div>
            </div>
          )}

          {hasPhone && (
            <>
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 block mb-3">
                  Templates de Mensagem
                </label>
                <div className="space-y-2">
                  {activeTemplates.length === 0 && (
                    <p className="text-sm text-neutral-400 italic px-1">
                      Nenhum template ativo. Crie templates em Configurações &gt; Templates de WhatsApp.
                    </p>
                  )}
                  {activeTemplates.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(t.id);
                        setIsEditing(false);
                        setOpenWithoutMessage(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedTemplateId === t.id
                          ? 'border-black bg-neutral-50'
                          : 'border-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-sm font-bold text-black block">{t.name}</span>
                      <span className="text-xs text-neutral-400 font-medium mt-0.5 block truncate">
                        {t.message.replace(/[{}]/g, '').substring(0, 80)}...
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpenWithoutMessage(true);
                  setSelectedTemplateId(null);
                  setIsEditing(false);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                  openWithoutMessage
                    ? 'border-black bg-neutral-50'
                    : 'border-dashed border-neutral-300 hover:border-neutral-400'
                }`}
              >
                <MessageCircle size={18} className="text-neutral-400 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-black block">Abrir sem mensagem personalizada</span>
                  <span className="text-xs text-neutral-400 font-medium">Apenas o link do WhatsApp será aberto</span>
                </div>
              </button>

              {(selectedTemplate || openWithoutMessage) && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      {openWithoutMessage ? 'Mensagem' : 'Preview da Mensagem'}
                    </span>
                    {selectedTemplate && (
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className="flex items-center gap-1.5 text-xs font-bold text-black hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        <Edit3 size={12} />
                        {isEditing ? 'Visualizar' : 'Editar antes de enviar'}
                      </button>
                    )}
                  </div>

                  {openWithoutMessage ? (
                    <p className="text-sm text-neutral-400 italic">Nenhuma mensagem será enviada.</p>
                  ) : isEditing ? (
                    <textarea
                      value={editedMessage}
                      onChange={e => setEditedMessage(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-sm font-medium text-black focus:border-black outline-none resize-none"
                      rows={5}
                    />
                  ) : (
                    <div className="bg-white rounded-lg p-3 text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      {previewMessage}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={!hasPhone}
            className="flex-[2] py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: '#25D366', color: 'white' }}
          >
            <ExternalLink size={16} />
            Abrir no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
