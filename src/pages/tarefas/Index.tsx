import { useState, useEffect, useRef, useCallback, useMemo, createPortal } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Calendar,
  Check,
  Circle,
  X,
  Trash2,
  Search,
  Hash,
  FileText,
  Type,
  Calculator,
  Users,
  User as UserIcon,
  CheckCircle2,
  Flag,
  File,
  Upload,
  BarChart3,
  Clock3,
  StickyNote,
  Zap,
  LayoutGrid,
  List,
  AlertCircle,
  TrendingUp,
  Clock,
  Target,
  CheckSquare,
  MoreHorizontal,
  Copy,
  Palette
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

type ColumnType = 'checkbox' | 'text' | 'status' | 'priority' | 'date' | 'number' | 'file' | 'timeline' | 'notes' | 'users' | 'formula';

interface FileMetadata {
  name: string;
  type: string;
  size: number;
  preview?: string;
}

interface Column {
  id: string;
  title: string;
  type: ColumnType;
  width: number;
  formula?: string;
}

interface Task {
  id: string;
  title: string;
  values: Record<string, any>;
}

interface Group {
  id: string;
  title: string;
  color: string;
  isExpanded: boolean;
  tasks: Task[];
}

const STATUS_OPTIONS = ['Não iniciado', 'Em andamento', 'Feito', 'Parado'];
const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  'Não iniciado': { bg: 'bg-neutral-400', text: 'text-white' },
  'Em andamento': { bg: 'bg-orange-500', text: 'text-white' },
  'Feito': { bg: 'bg-emerald-500', text: 'text-white' },
  'Parado': { bg: 'bg-red-500', text: 'text-white' },
};

const PRIORITY_OPTIONS = ['Baixa', 'Média', 'Alta'];
const PRIORITY_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  'Baixa': { bg: 'bg-sky-400', text: 'text-white', label: 'Baixa' },
  'Média': { bg: 'bg-blue-500', text: 'text-white', label: 'Média' },
  'Alta': { bg: 'bg-indigo-600', text: 'text-white', label: 'Alta' },
};

const TOOL_CATALOG = [
  {
    category: 'Essenciais',
    items: [
      { id: 'status', label: 'Status', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', type: 'status' as ColumnType },
      { id: 'priority', label: 'Prioridade', icon: Flag, color: 'text-red-500', bg: 'bg-red-50', type: 'priority' as ColumnType },
      { id: 'date', label: 'Data', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', type: 'date' as ColumnType },
      { id: 'users', label: 'Pessoas', icon: Users, color: 'text-amber-500', bg: 'bg-amber-50', type: 'users' as ColumnType },
    ]
  },
  {
    category: 'Super úteis',
    items: [
      { id: 'number', label: 'Números', icon: Hash, color: 'text-purple-500', bg: 'bg-purple-50', type: 'number' as ColumnType },
      { id: 'formula', label: 'Fórmula', icon: Calculator, color: 'text-indigo-500', bg: 'bg-indigo-50', type: 'formula' as ColumnType },
      { id: 'file', label: 'Arquivos', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50', type: 'file' as ColumnType },
      { id: 'timeline', label: 'Cronograma', icon: Clock3, color: 'text-cyan-500', bg: 'bg-cyan-50', type: 'timeline' as ColumnType },
      { id: 'notes', label: 'Notas', icon: StickyNote, color: 'text-yellow-500', bg: 'bg-yellow-50', type: 'notes' as ColumnType },
      { id: 'text', label: 'Texto', icon: Type, color: 'text-blue-500', bg: 'bg-blue-50', type: 'text' as ColumnType },
    ]
  }
];

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-status', title: 'Status', type: 'status', width: 140 },
  { id: 'col-responsible', title: 'Responsável', type: 'users', width: 120 },
  { id: 'col-priority', title: 'Prioridade', type: 'priority', width: 100 },
  { id: 'col-deadline', title: 'Prazo', type: 'date', width: 120 },
  { id: 'col-budget', title: 'Orçamento', type: 'number', width: 120 },
  { id: 'col-notes', title: 'Notas', type: 'notes', width: 80 },
  { id: 'col-files', title: 'Arquivos', type: 'file', width: 80 },
  { id: 'col-timeline', title: 'Cronograma', type: 'timeline', width: 160 },
  { id: 'col-updated', title: 'Última Atualização', type: 'date', width: 140 },
];

const DEFAULT_GROUPS: Group[] = [
  {
    id: 'g1',
    title: 'Tarefas Pendentes',
    color: '#579bfc',
    isExpanded: true,
    tasks: [
      { id: '1', title: 'Lead - Clínica Sorriso', values: { 
        'col-status': 'Em andamento', 
        'col-responsible': { name: 'João Silva', avatar: null },
        'col-priority': 'Alta',
        'col-deadline': '2026-04-25',
        'col-budget': 15000,
        'col-notes': 'Aguardando aprovação',
        'col-timeline': { start: '2026-04-20', end: '2026-04-28', progress: 60 }
      }},
      { id: '2', title: 'Follow-up Cliente XPTO', values: { 
        'col-status': 'Não iniciado', 
        'col-responsible': { name: 'Maria Santos', avatar: null },
        'col-priority': 'Média',
        'col-deadline': '2026-04-30',
        'col-budget': 8500,
        'col-timeline': { start: '2026-04-22', end: '2026-05-05', progress: 0 }
      }},
    ]
  },
  {
    id: 'g2',
    title: 'Concluídos',
    color: '#00c875',
    isExpanded: false,
    tasks: [
      { id: '3', title: 'Projeto Redesign Site', values: { 
        'col-status': 'Feito', 
        'col-responsible': { name: 'Carlos Oliveira', avatar: null },
        'col-priority': 'Baixa',
        'col-deadline': '2026-04-15',
        'col-budget': 12000,
        'col-timeline': { start: '2026-04-01', end: '2026-04-15', progress: 100 }
      }},
    ]
  }
];

const Avatar = ({ name, size = 'sm' }: { name: string | null | undefined; size?: 'sm' | 'md' }) => {
  const safeName = name || 'Usuário';
  const initials = safeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const bgColor = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'][safeName.length % 5];
  
  if (size === 'md') {
    return (
      <div className={`${bgColor} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
        {initials}
      </div>
    );
  }
  
  return (
    <div className={`${bgColor} w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold`}>
      {initials}
    </div>
  );
};

const AVAILABLE_USERS = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Maria Santos' },
  { id: '3', name: 'Carlos Souza' },
  { id: '4', name: 'Ana Oliveira' },
  { id: '5', name: 'Pedro Lima' },
  { id: '6', name: 'Julia Costa' },
];

const UserSelector = ({ currentUser, onSelect, onClose }: { currentUser?: { name: string }; onSelect: (user: { id: string; name: string }) => void; onClose: () => void }) => {
  return createPortal(
    <div 
      className="fixed inset-0 z-[999]"
      onClick={onClose}
    >
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-neutral-100">
          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Selecionar Pessoa</p>
        </div>
        <div className="p-2 max-h-[240px] overflow-y-auto">
          {AVAILABLE_USERS.map(user => (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <Avatar name={user.name} />
              <span className="text-sm font-medium text-neutral-700">{user.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

const ResponsibleInput = ({ 
  value, 
  onSave, 
  onError 
}: { 
  value?: { name: string }; 
  onSave: (name: string) => void;
  onError?: (error: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value?.name || '');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value?.name !== inputValue && !isEditing) {
      setInputValue(value?.name || '');
    }
  }, [value?.name]);

  const handleSave = () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      setError('Nome do responsável é obrigatório');
      if (onError) onError('Nome do responsável é obrigatório');
      return;
    }

    setError(null);
    try {
      onSave(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      const errorMsg = 'Erro ao atualizar responsável';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(value?.name || '');
      setError(null);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button 
        onClick={() => {
          setIsEditing(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full text-left px-1 py-0.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 rounded transition-colors"
      >
        {value?.name || '—'}
      </button>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setError(null);
        }}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="Digite o nome do responsável..."
        className={`w-full px-1 py-0.5 text-xs font-medium rounded border transition-colors outline-none ${
          error 
            ? 'border-red-500 bg-red-50 text-red-700 placeholder:text-red-300' 
            : 'border-neutral-300 text-neutral-700 focus:border-black'
        }`}
      />
      {error && (
        <p className="absolute top-full left-0 mt-0.5 text-[10px] text-red-600">{error}</p>
      )}
    </div>
  );
};

const DatePickerCell = ({ 
  value, 
  onSave 
}: { 
  value?: string; 
  onSave: (date: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing && value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (inputValue) {
      const date = new Date(inputValue);
      if (isNaN(date.getTime())) {
        alert('Data inválida');
        return;
      }
      onSave(inputValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(value || '');
      setIsEditing(false);
    }
  };

  const formatDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '—';
    }
  };

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        className="w-full text-center px-1 py-0.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 rounded transition-colors cursor-pointer"
      >
        {formatDisplay(value)}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="date"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full px-1 py-0.5 text-xs font-medium rounded border border-neutral-300 outline-none focus:border-black"
    />
  );
};

const NumberInputCell = ({ 
  value, 
  onSave 
}: { 
  value?: number; 
  onSave: (value: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value ? String(value) : '');
      setError(null);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    const cleaned = inputValue.replace(/[R$\s.]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    
    if (inputValue && isNaN(num)) {
      setError('Valor inválido');
      return;
    }
    
    setError(null);
    if (!isNaN(num)) {
      onSave(num);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(value ? String(value) : '');
      setError(null);
      setIsEditing(false);
    }
  };

  const formatDisplay = (num?: number) => {
    if (!num && num !== 0) return '—';
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    } catch {
      return '—';
    }
  };

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        className="w-full text-right px-1 py-0.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 rounded transition-colors cursor-pointer"
      >
        {formatDisplay(value)}
      </button>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setError(null);
        }}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="R$ 0,00"
        className={`w-full px-1 py-0.5 text-xs font-bold rounded border outline-none text-right ${
          error 
            ? 'border-red-500 bg-red-50 text-red-700' 
            : 'border-neutral-300 text-neutral-700 focus:border-black'
        }`}
      />
      {error && (
        <p className="absolute top-full right-0 mt-0.5 text-[10px] text-red-600">{error}</p>
      )}
    </div>
  );
};

const TimelineBar = ({ data }: { data: { start: string; end: string; progress: number } }) => {
  if (!data?.start || !data?.end) {
    return <div className="h-2 bg-neutral-100 rounded-full w-24" />;
  }
  
  const startDate = new Date(data.start);
  const endDate = new Date(data.end);
  const today = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedPercent = Math.max(0, Math.min(100, (daysPassed / totalDays) * 100));
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            data.progress === 100 ? 'bg-emerald-500' : 
            elapsedPercent > 90 ? 'bg-red-500' : 
            elapsedPercent > 70 ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.max(data.progress, elapsedPercent)}%` }}
        />
      </div>
      <span className="text-[9px] font-medium text-neutral-400 w-8 text-right">
        {data.progress}%
      </span>
    </div>
  );
};

const StatusBadge = ({ value }: { value: string }) => {
  const config = STATUS_CONFIG[value] || { bg: 'bg-neutral-100', text: 'text-neutral-400' };
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${config.bg} ${config.text}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
      <span className="text-[10px] font-semibold">{value || 'Não iniciado'}</span>
    </div>
  );
};

const PriorityBadge = ({ value }: { value: string }) => {
  const config = PRIORITY_CONFIG[value] || { bg: 'bg-neutral-100', text: 'text-neutral-400', label: '—' };
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${config.bg} ${config.text}`}>
      <Flag size={10} />
      <span className="text-[10px] font-semibold">{config.label}</span>
    </div>
  );
};

const FileUploadCell = ({ taskId, colId, value, onUpdate }: { taskId: string; colId: string; value: FileMetadata | null; onUpdate: (v: any) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const metadata: FileMetadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        preview: file.type.startsWith('image/') ? reader.result as string : undefined
      };
      onUpdate(metadata);
    };
    reader.readAsDataURL(file);
  };
  
  if (value) {
    return (
      <div className="flex items-center gap-1">
        {value.preview ? (
          <img src={value.preview} className="w-5 h-5 rounded object-cover" alt="" />
        ) : (
          <FileText size={14} className="text-blue-500" />
        )}
        <span className="text-[10px] font-medium text-neutral-600 truncate max-w-[60px]">{value.name}</span>
      </div>
    );
  }
  
  return (
    <button 
      onClick={() => fileInputRef.current?.click()}
      className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} 
      />
      <Plus size={14} className="text-neutral-300" />
    </button>
  );
};

const NotesCell = ({ value, onUpdate }: { value: string; onUpdate: (v: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value || '');
  
  if (isEditing) {
    return (
      <input
        autoFocus
        className="w-full h-8 bg-white border-2 border-black rounded-md px-2 text-[10px] font-medium outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { onUpdate(text); setIsEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onUpdate(text); setIsEditing(false); } }}
      />
    );
  }
  
  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-1 text-neutral-400 hover:text-neutral-600 transition-colors"
    >
      <StickyNote size={14} />
      {value ? (
        <span className="text-[10px] font-medium text-neutral-600 truncate max-w-[60px]">{value}</span>
      ) : (
        <span className="text-[10px]">+</span>
      )}
    </button>
  );
};

const TaskModal = ({ task, columns, onSave, onClose, onChange }: { task: Task; columns: Column[]; onSave: (t: Task) => void; onClose: () => void; onChange: (t: Task) => void }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6 md:mb-8">
            <h2 className="text-2xl font-black text-black tracking-tight">Nova Tarefa</h2>
            <button onClick={onClose} className="p-2 text-neutral-300 hover:text-black transition-colors">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (task.title) onSave(task); }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Nome da Tarefa</label>
              <input 
                autoFocus 
                required 
                className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-base font-bold focus:border-black outline-none transition-colors" 
                value={task?.title || ''} 
                onChange={(e) => onChange({ ...task, title: e.target.value })} 
                placeholder="Digite o nome da tarefa..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {columns.filter(c => c.type !== 'formula' && c.type !== 'timeline').map((col) => (
                <div key={col.id} className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{col.title}</label>
                  {col.type === 'status' && (
                    <select 
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none"
                      value={task?.values?.[col.id] || ''}
                      onChange={(e) => onChange({ ...task, values: { ...task.values, [col.id]: e.target.value } })}
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                  {col.type === 'priority' && (
                    <select 
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none"
                      value={task?.values?.[col.id] || ''}
                      onChange={(e) => onChange({ ...task, values: { ...task.values, [col.id]: e.target.value } })}
                    >
                      {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                  {col.type === 'date' && (
                    <input 
                      type="date" 
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none"
                      value={task?.values?.[col.id] || ''}
                      onChange={(e) => onChange({ ...task, values: { ...task.values, [col.id]: e.target.value } })}
                    />
                  )}
                  {col.type === 'number' && (
                    <input 
                      type="number" 
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none"
                      value={task?.values?.[col.id] || ''}
                      onChange={(e) => onChange({ ...task, values: { ...task.values, [col.id]: parseFloat(e.target.value) || 0 } })}
                      placeholder="0"
                    />
                  )}
                  {col.type === 'users' && (
                    <input 
                      type="text" 
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none"
                      value={task?.values?.[col.id]?.name || ''}
                      onChange={(e) => onChange({ ...task, values: { ...task.values, [col.id]: { name: e.target.value, avatar: null } } })}
                      placeholder="Nome do responsável"
                    />
                  )}
                  {col.type !== 'status' && col.type !== 'priority' && col.type !== 'date' && col.type !== 'number' && col.type !== 'users' && (
                    <input 
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none"
                      value={task?.values?.[col.id] || ''} 
                      onChange={(e) => onChange({ ...task, values: { ...task.values, [col.id]: e.target.value } })}
                    />
                  )}
                </div>
              ))}
            </div>
            <button 
              type="submit" 
              className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-neutral-800 transition-all"
            >
              Salvar Tarefa
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const ReportsView = ({ data }: { data: any }) => {
  const statusData = [
    { name: 'Feito', value: data.totals.done, color: '#10b981' },
    { name: 'Em andamento', value: data.totals.inProgress, color: '#f97316' },
    { name: 'Parado', value: data.totals.blocked, color: '#ef4444' },
    { name: 'Não iniciado', value: data.totals.total - data.totals.done - data.totals.inProgress - data.totals.blocked, color: '#9ca3af' },
  ].filter(d => d.value > 0);

  return (
    <div className="px-4 pb-24">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neutral-100">
              <List size={20} className="text-neutral-600" />
            </div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">Todos os itens</span>
          </div>
          <p className="text-3xl font-black">{data.totals.total}</p>
          <p className="text-xs text-neutral-400 mt-1">tarefas cadastradas</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-50">
              <Clock size={20} className="text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">Em andamento</span>
          </div>
          <p className="text-3xl font-black text-orange-600">{data.totals.inProgress}</p>
          <p className="text-xs text-neutral-400 mt-1">tarefas ativas</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">Parado</span>
          </div>
          <p className="text-3xl font-black text-red-600">{data.totals.blocked}</p>
          <p className="text-xs text-neutral-400 mt-1">tarefas bloqueadas</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-50">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">Feito</span>
          </div>
          <p className="text-3xl font-black text-emerald-600">{data.totals.done}</p>
          <p className="text-xs text-neutral-400 mt-1">tarefas concluídas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-black mb-4">Tarefas por Status</h3>
          <div className="h-[280px] min-h-[280px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value} tarefas`, '']}
                  />
                  <Legend 
                    formatter={(value) => <span className="text-sm font-medium text-neutral-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400">
                <p className="text-sm">Nenhuma tarefa encontrada</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-black mb-4">Tarefas por Responsável</h3>
          <div className="h-[280px] min-h-[280px]">
            {data?.responsibleData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.responsibleData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#6b7280" width={100} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value} tarefas`, '']}
                  />
                  <Bar dataKey="tarefas" fill="#1f2937" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400">
                <p className="text-sm">Nenhum responsável encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-black">Tarefas Atrasadas</h3>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${data.overdueTasks > 0 ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-400'}`}>
              {data.overdueTasks}
            </span>
          </div>
          <div className="h-[200px] min-h-[200px] flex items-center justify-center">
            {data.overdueTasks > 0 ? (
              <div className="text-center">
                <p className="text-5xl font-black text-red-500">{data.overdueTasks}</p>
                <p className="text-sm text-neutral-500 mt-2">tarefas fora do prazo</p>
              </div>
            ) : (
              <div className="text-center">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Nenhuma tarefa atrasada</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-black mb-4">Tarefas por Prazo</h3>
          <div className="h-[200px] min-h-[200px]">
            {data.deadlineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.deadlineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value} tarefas`, '']}
                  />
                  <Bar dataKey="tarefas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400">
                <p className="text-sm">Nenhum prazo definido</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Tarefas = () => {
  const [columns, setColumns] = useState<Column[]>(() => {
    const stored = localStorage.getItem('axium_cols_v5');
    if (stored) return JSON.parse(stored);
    return DEFAULT_COLUMNS;
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const stored = localStorage.getItem('axium_groups_v5');
    if (stored) return JSON.parse(stored);
    return DEFAULT_GROUPS;
  });

  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [columnOpenByGroup, setColumnOpenByGroup] = useState<Record<string, boolean>>({});
  const [tableScrollLeft, setTableScrollLeft] = useState(0);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [searchTool, setSearchTool] = useState('');
  const [activeCellMenu, setActiveCellMenu] = useState<{ taskId: string; colId: string } | null>(null);
  const [quickAddTitles, setQuickAddTitles] = useState<Record<string, string>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [userSelectorState, setUserSelectorState] = useState<{ taskId: string; colId: string } | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [columnContextMenu, setColumnContextMenu] = useState<{ colId: string; x: number; y: number } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('g1');
  const [currentView, setCurrentView] = useState<'board' | 'reports'>('board');

  const quickAddInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    localStorage.setItem('axium_cols_v5', JSON.stringify(columns));
    localStorage.setItem('axium_groups_v5', JSON.stringify(groups));
  }, [columns, groups]);

  const evaluateFormula = useCallback((formula: string, taskValues: Record<string, any>) => {
    try {
      if (!formula) return '—';
      let expression = formula;
      columns.forEach(col => {
        const placeholder = `{${col.title}}`;
        if (expression.includes(placeholder)) {
          const val = parseFloat(taskValues[col.id]) || 0;
          expression = expression.split(placeholder).join(val.toString());
        }
      });
      const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');
      const result = eval(sanitized);
      if (isNaN(result) || !isFinite(result)) return 'Erro';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result);
    } catch { return 'Erro'; }
  }, [columns]);

  const updateTaskValue = (taskId: string, colId: string, value: any) => {
    setGroups(prev => prev.map(g => ({
      ...g,
      tasks: g.tasks.map(t => t.id === taskId ? { ...t, values: { ...t.values, [colId]: value } } : t)
    })));
    setActiveCellMenu(null);
  };

  const updateTaskTitle = (taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setGroups(prev => prev.map(g => ({
      ...g,
      tasks: g.tasks.map(t => t.id === taskId ? { ...t, title: newTitle.trim() } : t)
    })));
    setEditingTaskId(null);
  };

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const handleQuickAdd = (groupId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const title = quickAddTitles[groupId]?.trim();
      if (title) {
        const newTask: Task = {
          id: Math.random().toString(36).substring(2, 9),
          title: title,
          values: { 'col-status': 'Não iniciado' }
        };
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, tasks: [...g.tasks, newTask] } : g));
        setQuickAddTitles(prev => ({ ...prev, [groupId]: '' }));
      }
    }
  };

  const handleAddGroup = () => {
    const title = newGroupTitle.trim();
    if (!title) return;
    
    const currentGroups = Array.isArray(groups) ? groups : [];
    
    if (currentGroups.some(g => g.title.toLowerCase() === title.toLowerCase())) {
      alert('Já existe um quadro com este nome. Escolha outro nome.');
      return;
    }
    
    const colors = ['#579bfc', '#00c875', '#ffcb00', '#ff5ac6', '#8e44ad', '#e74c3c'];
    const usedColors = currentGroups.map(g => g.color);
    const availableColor = colors.find(c => !usedColors.includes(c)) || colors[0];
    
    const newGroup: Group = {
      id: `g-${Date.now()}`,
      title,
      color: availableColor,
      isExpanded: true,
      tasks: []
    };
    
    setGroups(prev => {
      const updated = [...prev, newGroup];
      localStorage.setItem('axium_groups_v5', JSON.stringify(updated));
      return updated;
    });
    
    setNewGroupTitle('');
    setIsAddingGroup(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm('Tem certeza que deseja deletar este quadro? Todas as tarefas serão excluídas.')) return;
    
    setGroups(prev => {
      const updated = prev.filter(g => g.id !== groupId);
      localStorage.setItem('axium_groups_v5', JSON.stringify(updated));
      return updated;
    });
  };

  const addColumn = (tool: any) => {
    const existingColumn = columns.find(c => c.type === tool.type);
    if (existingColumn) {
      alert(`Uma coluna "${tool.label}" já existe.删除ione outra Primeiramente.`);
      return;
    }
    const newId = `col-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newColumn: Column = {
      id: newId,
      title: tool.label,
      type: tool.type,
      width: tool.type === 'timeline' ? 180 : 140,
      formula: tool.type === 'formula' ? '' : undefined
    };
const updated = [...columns, newColumn];
    setColumns(updated);
    localStorage.setItem('axium_cols_v5', JSON.stringify(updated));
    setColumnOpenByGroup({});
  };

  const handleDeleteColumn = (colId: string) => {
    const col = columns.find(c => c.id === colId);
    const colTitle = col?.title || '';
    if (colTitle.toLowerCase() === 'tarefa') {
      alert('A coluna TAREFA não pode ser deletada.');
      return;
    }
    if (!confirm(`Tem certeza que deseja deletar a coluna "${colTitle}"? Todos os dados dessa coluna serão excluídos.`)) return;
    const updated = columns.filter(c => c.id !== colId);
    setColumns(updated);
    localStorage.setItem('axium_cols_v5', JSON.stringify(updated));
    setColumnContextMenu(null);
  };

  const handleEditColumnName = (colId: string, newName: string) => {
    if (!newName.trim()) return;
    if (columns.some(c => c.id !== colId && c.title.toLowerCase() === newName.toLowerCase())) {
      alert('Já existe uma coluna com este nome.');
      return;
    }
    const updated = columns.map(c => c.id === colId ? { ...c, title: newName.trim() } : c);
    setColumns(updated);
    localStorage.setItem('axium_cols_v5', JSON.stringify(updated));
    setEditingColumnId(null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragId(null);
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = columns.findIndex(c => c.id === active.id);
    const newIndex = columns.findIndex(c => c.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const updated = arrayMove(columns, oldIndex, newIndex);
      setColumns(updated);
      localStorage.setItem('axium_cols_v5', JSON.stringify(updated));
    }
  };

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

const SortableHeaderCell = ({ column, onDelete }: { column: Column; onDelete?: (colId: string) => void }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: column.id });

    const style = transform 
      ? { transform: `translateX(${transform.x}px)`, transition } 
      : { transition };
    
    const isTaskColumn = column.title.toLowerCase() === 'tarefa';

    return (
      <th
        ref={setNodeRef}
        style={{ ...style, ...{ width: column.width } }}
        className="p-3 border-l border-neutral-200 text-center font-semibold relative group text-neutral-600 dark:text-neutral-200"
      >
        <div className="flex items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest">{column.title}</span>
          {!isTaskColumn && onDelete && (
            <button
              onClick={() => onDelete(column.id)}
              className="text-neutral-300 hover:text-red-500 text-xs ml-1 opacity-60 hover:opacity-100 transition-opacity"
              title="Excluir coluna"
            >
              ×
            </button>
          )}
        </div>
      </th>
    );
  };

  useEffect(() => {
    const handleClickOutside = () => setColumnContextMenu(null);
    if (columnContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [columnContextMenu]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleAllInGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const allSelected = group.tasks.every(t => selectedTasks.has(t.id));
    setSelectedTasks(prev => {
      const next = new Set(prev);
      group.tasks.forEach(t => {
        if (allSelected) next.delete(t.id);
        else next.add(t.id);
      });
      return next;
    });
  };

  const allTasks = groups?.flatMap(g => g.tasks) || [];
  const totalTasksCount = allTasks.length;
  const doneTasksCount = allTasks.filter(t => t?.values?.['col-status'] === 'Feito').length;

  const reportData = useMemo(() => {
    const inProgressCount = allTasks.filter(t => t?.values?.['col-status'] === 'Em andamento').length;
    const pendingCount = allTasks.filter(t => t?.values?.['col-status'] === 'Não iniciado').length;
    const blockedCount = allTasks.filter(t => t?.values?.['col-status'] === 'Parado').length;
    const doneCount = allTasks.filter(t => t?.values?.['col-status'] === 'Feito').length;
    const total = allTasks.length;

    const responsibleMap: Record<string, number> = {};
    allTasks.forEach(task => {
      const name = task?.values?.['col-responsible']?.name || 'Sem responsável';
      responsibleMap[name] = (responsibleMap[name] || 0) + 1;
    });
    const responsibleData = Object.entries(responsibleMap).map(([name, tarefas]) => ({ name, tarefas }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueTasks = allTasks.filter(t => {
      const deadline = t?.values?.['col-deadline'];
      if (!deadline) return false;
      return new Date(deadline) < today && t?.values?.['col-status'] !== 'Feito';
    }).length;

    const deadlineMap: Record<string, number> = {};
    allTasks.forEach(task => {
      const deadline = task?.values?.['col-deadline'];
      if (!deadline) return;
      const date = new Date(deadline);
      const key = date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
      deadlineMap[key] = (deadlineMap[key] || 0) + 1;
    });
    const deadlineData = Object.entries(deadlineMap).map(([name, tarefas]) => ({ name, tarefas }));

    return {
      totals: { total, inProgress: inProgressCount, blocked: blockedCount, done: doneCount },
      responsibleData,
      overdueTasks,
      deadlineData,
    };
  }, [allTasks]);

  const filteredTools = searchTool
    ? TOOL_CATALOG.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.label.toLowerCase().includes(searchTool.toLowerCase()))
      })).filter(cat => cat.items.length > 0)
    : TOOL_CATALOG;

  return (
    <div className="bg-white min-h-screen text-black">
      <div className="mb-6 px-4 pt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Operações Axium</h1>
            <p className="text-neutral-500 text-sm font-medium">Gestão dinâmica de alto desempenho.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
              <button
                onClick={() => setCurrentView('board')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  currentView === 'board' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'
                }`}
              >
                <LayoutGrid size={18} />
                Quadro
              </button>
              <button
                onClick={() => setCurrentView('reports')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  currentView === 'reports' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'
                }`}
              >
                <BarChart3 size={18} />
                Painéis
              </button>
            </div>
            {currentView === 'board' && (
              <>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Progresso</p>
                    <p className="text-xl font-black">{totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0}%</p>
                  </div>
                  <div className="w-40 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 0}%` }} />
                  </div>
                </div>
                <button 
                  onClick={() => { setTargetGroupId('g1'); setEditingTask({ id: Math.random().toString(36).substring(2, 9), title: '', values: {} }); setIsTaskModalOpen(true); }}
                  className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg"
                >
                  <Plus size={16} className="inline mr-2" strokeWidth={2} /> Nova Tarefa
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {currentView === 'board' ? (
        <div className="space-y-6 px-4 pb-24">
          <div className="flex items-center gap-3">
            {isAddingGroup ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGroup();
                    if (e.key === 'Escape') { setIsAddingGroup(false); setNewGroupTitle(''); }
                  }}
                  placeholder="Nome do novo quadro..."
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold outline-none focus:border-black"
                  autoFocus
                />
                <button 
                  onClick={handleAddGroup}
                  className="p-2 bg-black text-white rounded-lg hover:bg-neutral-800"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => { setIsAddingGroup(false); setNewGroupTitle(''); }}
                  className="p-2 text-neutral-400 hover:text-black"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingGroup(true)}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-neutral-300 rounded-lg text-sm font-semibold text-neutral-400 hover:border-black hover:text-black transition-all"
              >
                <Plus size={16} />
                Adicionar quadro
              </button>
            )}
</div>

          {groups && Array.isArray(groups) && groups.map(group => (
            <div key={group.id}>
              <div 
                className="flex items-center gap-3 mb-3 cursor-pointer group/header"
                onClick={() => setGroups(prev => prev.map(g => g.id === group.id ? { ...g, isExpanded: !g.isExpanded } : g))}
              >
                <div className="w-2 h-6 rounded-full" style={{ backgroundColor: group.color }} />
                {group.isExpanded ? <ChevronDown size={18} className="text-neutral-400" /> : <ChevronRight size={18} className="text-neutral-400" />}
                <h2 className="text-lg font-black transition-all group-hover/header:translate-x-1" style={{ color: group.color }}>{group.title}</h2>
                <span className="text-xs text-neutral-300 font-medium ml-2">{group.tasks.length} itens</span>
                {group.id.startsWith('g-') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                    className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                )}
              </div>

              {group.isExpanded && Array.isArray(group.tasks) && (
                <div className="border border-neutral-200 rounded-2xl bg-white shadow-sm overflow-x-auto overflow-y-visible" style={{ overflowX: 'auto', overflowY: 'visible' }}>
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] text-neutral-400 font-black uppercase tracking-widest sticky top-0 z-10">
                        <th className="w-10 p-3 border-r border-neutral-200 bg-neutral-50 sticky left-0 z-20">
                          <button 
                            onClick={() => toggleAllInGroup(group.id)}
                            className="w-5 h-5 rounded border-2 border-neutral-200 flex items-center justify-center hover:border-black transition-colors"
                          >
                            {group.tasks.every(t => selectedTasks.has(t.id)) && group.tasks.length > 0 && (
                              <Check size={12} className="text-black" strokeWidth={3} />
                            )}
                          </button>
                        </th>
                        <th className="text-left p-3 min-w-[280px] font-semibold sticky left-10 bg-neutral-50 z-10 text-[10px] font-black text-neutral-600 uppercase tracking-widest">Tarefa</th>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={columns.map(c => c.id)}
                            strategy={horizontalListSortingStrategy}
                          >
                            {columns.map(col => (
                              <SortableHeaderCell key={col.id} column={col} onDelete={handleDeleteColumn} />
                            ))}
                          </SortableContext>
                        </DndContext>
                        <th className="w-12 p-3 border-l border-neutral-200 bg-neutral-50/50 text-center relative">
                          <button 
                            onClick={() => setColumnOpenByGroup(prev => ({ ...prev, [group.id]: !prev[group.id] }))} 
                            className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-all text-neutral-400 hover:text-black"
                            title="Adicionar coluna"
                          >
                            <Plus size={18} />
                          </button>
                          {columnOpenByGroup[group.id] && (
                            <div className="fixed z-[500] w-[340px] bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden max-h-[72vh]" style={{ overflowY: 'auto', right: '80px' }}>
                              <div className="p-4 border-b border-neutral-100">
                                <div className="relative">
                                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                  <input 
                                    autoFocus 
                                    type="text" 
                                    placeholder="Pesquise ou descreva sua coluna" 
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium placeholder:text-neutral-400 outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all"
                                    value={searchTool}
                                    onChange={(e) => setSearchTool(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="p-3 max-h-[320px] overflow-y-auto">
                                {filteredTools.map(cat => (
                                  <div key={cat.category} className="mb-4 last:mb-0">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                      {cat.category === 'Essenciais' && (
                                        <>
                                          <CheckCircle2 size={14} className="text-emerald-500" />
                                          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Essenciais</p>
                                        </>
                                      )}
                                      {cat.category === 'Super úteis' && (
                                        <>
                                          <Zap size={14} className="text-amber-500" />
                                          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Super úteis</p>
                                        </>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {cat.items.map(tool => (
                                        <button 
                                          key={tool.id} 
                                          onClick={() => addColumn(tool)} 
                                          className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-100 hover:border-neutral-300 rounded-xl transition-all text-left group"
                                        >
                                          <div className="p-2 rounded-lg bg-white shadow-sm">
                                            <tool.icon size={18} className={tool.color} />
                                          </div>
                                          <span className="text-sm font-semibold text-neutral-700 group-hover:text-black">{tool.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(group.tasks) && group.tasks.map(task => (
                        <tr key={task.id} className={`border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors ${selectedTasks.has(task.id) ? 'bg-blue-50/30' : ''}`}>
                          <td className="p-3 border-r border-neutral-100 sticky left-0 bg-white z-10">
                            <button 
                              onClick={() => toggleTaskSelection(task.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                selectedTasks.has(task.id) 
                                  ? 'bg-black border-black text-white' 
                                  : 'border-neutral-200 hover:border-black'
                              }`}
                            >
                              {selectedTasks.has(task.id) && <Check size={12} strokeWidth={3} />}
                            </button>
                          </td>
                          <td className="p-3 sticky left-10 bg-white z-10">
                            {editingTaskId === task.id ? (
                              <input
                                type="text"
                                value={editingTaskTitle}
                                onChange={(e) => setEditingTaskTitle(e.target.value)}
                                onBlur={() => updateTaskTitle(task.id, editingTaskTitle)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') updateTaskTitle(task.id, editingTaskTitle);
                                  if (e.key === 'Escape') setEditingTaskId(null);
                                }}
                                autoFocus
                                className="w-full font-semibold text-sm text-neutral-700 bg-transparent border-none outline-none focus:ring-0 p-0 m-0"
                              />
                            ) : (
                              <span 
                                onClick={() => startEditingTask(task)}
                                className="font-semibold text-sm text-neutral-700 cursor-pointer hover:text-black"
                              >
                                {task.title}
                              </span>
                            )}
                          </td>
                          {columns.map(col => (
                            <td key={col.id} className="p-2 border-l border-neutral-100 text-center">
                              {col.type === 'status' && (
                                <div className="relative">
                                  <StatusBadge value={task.values[col.id]} />
                                  <div 
                                    className="absolute inset-0" 
                                    onClick={() => setActiveCellMenu({ taskId: task.id, colId: col.id })} 
                                  />
                                  {activeCellMenu?.taskId === task.id && activeCellMenu.colId === col.id && (
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[60] bg-white border border-neutral-200 rounded-xl shadow-xl p-1.5 min-w-[140px]">
                                      {STATUS_OPTIONS.map(opt => (
                                        <button 
                                          key={opt}
                                          onClick={() => updateTaskValue(task.id, col.id, opt)}
                                          className={`w-full p-2 rounded-lg text-[10px] font-semibold text-white mb-1 ${STATUS_CONFIG[opt].bg}`}
                                        >
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {col.type === 'priority' && (
                                <div className="relative">
                                  <PriorityBadge value={task.values[col.id]} />
                                  <div 
                                    className="absolute inset-0" 
                                    onClick={() => setActiveCellMenu({ taskId: task.id, colId: col.id })} 
                                  />
                                  {activeCellMenu?.taskId === task.id && activeCellMenu.colId === col.id && (
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[60] bg-white border border-neutral-200 rounded-xl shadow-xl p-1.5 min-w-[120px]">
                                      {PRIORITY_OPTIONS.map(opt => (
                                        <button 
                                          key={opt}
                                          onClick={() => updateTaskValue(task.id, col.id, opt)}
                                          className={`w-full p-2 rounded-lg text-[10px] font-semibold text-white mb-1 ${PRIORITY_CONFIG[opt].bg}`}
                                        >
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {col.type === 'date' && (
                                <DatePickerCell 
                                  value={task.values[col.id]}
                                  onSave={(date) => updateTaskValue(task.id, col.id, date)}
                                />
                              )}
                              {col.type === 'number' && (
                                <NumberInputCell 
                                  value={task.values[col.id]}
                                  onSave={(value) => updateTaskValue(task.id, col.id, value)}
                                />
                              )}
                              {col.type === 'users' && (
                                col.id === 'col-responsible' ? (
                                  <ResponsibleInput
                                    value={task.values[col.id]}
                                    onSave={(name) => updateTaskValue(task.id, col.id, { name })}
                                    onError={(msg) => {
                                      console.error(msg);
                                    }}
                                  />
                                ) : (
                                  task.values?.[col.id]?.name ? (
                                    <button 
                                      onClick={() => setUserSelectorState({ taskId: task.id, colId: col.id })}
                                      className="w-6 h-6 rounded-full flex items-center justify-center hover:ring-2 hover:ring-black/20 transition-all"
                                    >
                                      <Avatar name={task.values?.[col.id]?.name} />
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => setUserSelectorState({ taskId: task.id, colId: col.id })}
                                      className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 hover:ring-2 hover:ring-black/20 transition-colors"
                                    >
                                      <UserIcon size={12} className="text-neutral-400" />
                                    </button>
                                  )
                                )
                              )}
                              {userSelectorState?.taskId === task.id && userSelectorState.colId === col.id && (
                                <UserSelector
                                  currentUser={task.values[col.id]}
                                  onSelect={(user) => {
                                    updateTaskValue(task.id, col.id, user);
                                    setUserSelectorState(null);
                                  }}
                                  onClose={() => setUserSelectorState(null)}
                                />
                              )}
                              {col.type === 'file' && (
                                <FileUploadCell 
                                  taskId={task.id} 
                                  colId={col.id} 
                                  value={task.values[col.id]} 
                                  onUpdate={(v) => updateTaskValue(task.id, col.id, v)} 
                                />
                              )}
                              {col.type === 'notes' && (
                                <NotesCell 
                                  value={task.values[col.id]} 
                                  onUpdate={(v) => updateTaskValue(task.id, col.id, v)} 
                                />
                              )}
                              {col.type === 'timeline' && (
                                <TimelineBar data={task?.values?.[col.id] || {}} />
                              )}
                              {col.type === 'text' && (
                                <span className="text-xs font-medium text-neutral-600">{task.values[col.id] || '—'}</span>
                              )}
                              {col.type === 'formula' && (
                                <span className="text-xs font-bold text-neutral-800">
                                  {evaluateFormula(col.formula || '', task.values)}
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="p-3 border-l border-neutral-100 text-center">
                            <button 
                              onClick={() => { if (confirm('Excluir esta tarefa?')) setGroups(prev => prev.map(g => ({ ...g, tasks: g.tasks.filter(t => t.id !== task.id) }))) }} 
                              className="p-2 text-neutral-200 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      <tr className="bg-neutral-50/30">
                        <td colSpan={columns.length + 3} className="p-3 border-t border-neutral-100">
                          <div 
                            className="flex items-center gap-3 cursor-text max-w-md"
                            onClick={() => quickAddInputRefs.current[group.id]?.focus()}
                          >
                            <Plus size={16} className={quickAddTitles[group.id] ? 'text-black' : 'text-neutral-200'} strokeWidth={2} />
                            <input 
                              ref={el => quickAddInputRefs.current[group.id] = el}
                              type="text" 
                              placeholder="+ Adicionar tarefa"
                              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-neutral-400 focus:text-black outline-none placeholder:text-neutral-300 transition-all"
                              value={quickAddTitles[group.id] || ''}
                              onChange={(e) => setQuickAddTitles(prev => ({ ...prev, [group.id]: e.target.value }))}
                              onKeyDown={(e) => handleQuickAdd(group.id, e)}
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-100 border-t border-neutral-200">
                        <td className="p-3 border-r border-neutral-200"></td>
                        <td className="p-3">
                          <span className="text-xs font-black text-neutral-500">{group.tasks.length} tarefas</span>
                        </td>
                        {columns.map(col => (
                          <td key={col.id} className="p-3 border-l border-neutral-200 text-center">
                            {col.type === 'number' && (
                              <span className="text-xs font-bold text-neutral-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                  group.tasks.reduce((sum, t) => sum + (parseFloat(t.values[col.id]) || 0), 0)
                                )}
                              </span>
                            )}
                            {col.type === 'status' && (
                              <span className="text-xs font-medium text-neutral-500">
                                {Math.round((group.tasks.filter(t => t.values[col.id] === 'Feito').length / group.tasks.length * 100) || 0)}% Feito
                              </span>
                            )}
                            {col.type === 'timeline' && (
                              <span className="text-xs font-medium text-neutral-500">
                                {Math.round(group.tasks.reduce((sum, t) => sum + (t.values[col.id]?.progress || 0), 0) / group.tasks.length || 0)}%
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="p-3 border-l border-neutral-200"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <ReportsView data={reportData} />
      )}

      {isTaskModalOpen && editingTask && (
        <TaskModal
          task={editingTask}
          columns={columns}
          onSave={(task) => {
            setGroups(prev => prev.map(g => g.id === targetGroupId ? { ...g, tasks: [...g.tasks, task] } : g));
            setIsTaskModalOpen(false);
          }}
          onClose={() => setIsTaskModalOpen(false)}
          onChange={setEditingTask}
        />
      )}

      {(activeCellMenu || Object.values(columnOpenByGroup).some(Boolean)) && (
        <div className="fixed inset-0 z-[50]" onClick={() => { setActiveCellMenu(null); setColumnOpenByGroup({}); }} />
      )}
    </div>
  );
};

export default Tarefas;