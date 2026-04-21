import { useState, useEffect } from 'react';
import { useCRM } from '../../contexts/CRMContext';
import type { CalendarEvent } from '../../contexts/CRMContext';
import { X, ExternalLink, Clock, User, MessageSquare, Plus, Trash2, Calendar as CalendarIcon, Link as LinkIcon, FileText } from 'lucide-react';

const CRMCalendario = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useCRM();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Form State
  const [formData, setFormData] = useState<Omit<CalendarEvent, 'id'>>({
    title: '',
    activityType: 'Reunião',
    dateTime: '',
    createdBy: '',
    description: '',
    meetingLink: ''
  });

  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const safeEvents = Array.isArray(events) ? events : [];

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--:--';
    try {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '--:--';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--/--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--/--';
    try {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch (e) {
      return '--/--';
    }
  };

  const getEventsForDay = (day: number) => {
    return safeEvents.filter(e => {
      if (!e?.dateTime) return false;
      const d = new Date(e.dateTime);
      if (isNaN(d.getTime())) return false;
      // Hardcoded April 2026 for demo consistency with today = 21
      return d.getDate() === day && d.getMonth() === 3 && d.getFullYear() === 2026;
    });
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      title: '',
      activityType: 'Reunião',
      dateTime: '2026-04-21T10:00', // Default to current demo day
      createdBy: '',
      description: '',
      meetingLink: ''
    });
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: CalendarEvent) => {
    setModalMode('edit');
    setSelectedEvent(event);
    setFormData({
      title: event.title || '',
      activityType: event.activityType || 'Reunião',
      dateTime: event.dateTime || '',
      createdBy: event.createdBy || '',
      description: event.description || '',
      meetingLink: event.meetingLink || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      addEvent(formData);
    } else if (selectedEvent) {
      updateEvent(selectedEvent.id, formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (selectedEvent && window.confirm('Tem certeza que deseja excluir este evento?')) {
      deleteEvent(selectedEvent.id);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen p-2 md:p-8">
      <div className="mb-4 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mb-1">Calendário</h1>
          <p className="text-neutral-500 text-xs md:text-sm">Visualize e acompanhe seus compromissos agendados.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="w-full md:w-auto bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-sm"
        >
          <Plus size={14} className="md:w-4 md:h-4" strokeWidth={3} />
          <span className="hidden sm:inline">Criar</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>\n\n      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-6\">
        <div className="lg:col-span-3 bg-white border border-neutral-200 rounded-xl p-6 shadow-sm overflow-hidden">
          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {days.map((day) => (
              <div key={day} className="text-center text-[10px] text-neutral-400 font-black uppercase tracking-widest py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Body */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, idx) => {
              const dayNum = idx - 6;
              const isCurrentMonth = dayNum > 0 && dayNum <= 30;
              const isToday = dayNum === 21;
              const dayEvents = isCurrentMonth ? getEventsForDay(dayNum) : [];

              return (
                <div 
                  key={idx} 
                  className={`min-h-[120px] p-2 border border-neutral-100 rounded-lg flex flex-col gap-1 transition-all ${
                    isCurrentMonth ? 'bg-white hover:border-neutral-300' : 'bg-neutral-50/10'
                  } ${isToday ? 'ring-1 ring-black ring-inset' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-black ${
                      isToday ? 'bg-black text-white w-5 h-5 flex items-center justify-center rounded-full' : 
                      isCurrentMonth ? 'text-black' : 'text-neutral-200'
                    }`}>
                      {isCurrentMonth && dayNum}
                    </span>
                  </div>

                  {/* Day Events Tags */}
                  <div className="space-y-1">
                    {dayEvents.map(event => (
                      <button
                        key={event?.id || Math.random().toString()}
                        onClick={() => handleOpenEdit(event)}
                        className="w-full text-left p-1.5 rounded-md bg-neutral-50 border border-neutral-100 hover:border-black transition-all group overflow-hidden"
                      >
                        <div className="text-[9px] font-black text-black leading-none mb-1">
                          {formatTime(event?.dateTime)}
                        </div>
                        <div className="text-[9px] font-bold text-neutral-500 truncate leading-none">
                          {event?.activityType || 'Atividade'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Upcoming Events */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-6 border-b border-neutral-100 pb-4 flex items-center gap-2">
              <Clock size={12} />
              Próximos Eventos
            </h3>
            <div className="space-y-5">
              {safeEvents.slice(0, 5).map((event) => (
                <div 
                  key={event?.id || Math.random().toString()} 
                  className="group cursor-pointer"
                  onClick={() => handleOpenEdit(event)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 shrink-0" />
                    <div>
                      <p className="text-[13px] font-black text-black group-hover:underline leading-tight">{event?.title || 'Sem título'}</p>
                      <div className="flex flex-wrap items-center gap-x-2 mt-1.5">
                        <span className="text-[9px] font-black bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          {event?.activityType || 'Atividade'}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">
                          {formatDate(event?.dateTime)} · {formatTime(event?.dateTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {safeEvents.length === 0 && (
                <p className="text-[10px] text-neutral-400 text-center font-bold uppercase tracking-widest py-4 italic">Sem eventos</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal (Create/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300">
            <form onSubmit={handleSave}>
              <div className="px-8 py-7 border-b border-neutral-100 flex justify-between items-start bg-white">
                <div>
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-[2px] mb-2 block">
                    {modalMode === 'create' ? 'Novo Evento' : 'Editar Evento'}
                  </span>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título do Evento"
                    className="text-2xl font-black text-black tracking-tighter leading-tight w-full bg-transparent border-none p-0 focus:ring-0 placeholder:text-neutral-200"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400 hover:text-black mt-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                      <MessageSquare size={12} strokeWidth={3} />
                      Tipo de Atividade
                    </label>
                    <select
                      value={formData.activityType}
                      onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-black text-black focus:ring-1 focus:ring-black outline-none transition-all"
                    >
                      <option value="Reunião">Reunião</option>
                      <option value="Ligação">Ligação</option>
                      <option value="Treinamento">Treinamento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                      <CalendarIcon size={12} strokeWidth={3} />
                      Data e Hora
                    </label>
                    <input
                      required
                      type="datetime-local"
                      value={formData.dateTime}
                      onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-black text-black focus:ring-1 focus:ring-black outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                    <User size={12} strokeWidth={3} />
                    Quem agendou
                  </label>
                  <input
                    type="text"
                    value={formData.createdBy}
                    onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                    placeholder="Nome do responsável"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-black text-black focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                    <LinkIcon size={12} strokeWidth={3} />
                    Link da Reunião
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-black text-black focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                    <FileText size={12} strokeWidth={3} />
                    Descrição
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Adicione observações importantes..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-bold text-neutral-600 focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                  />
                </div>
              </div>
              
              <div className="px-8 py-5 bg-neutral-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {modalMode === 'edit' && (
                    <button 
                      type="button"
                      onClick={handleDelete}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-black text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-sm"
                  >
                    {modalMode === 'create' ? 'Salvar Evento' : 'Atualizar'}
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

export default CRMCalendario;
