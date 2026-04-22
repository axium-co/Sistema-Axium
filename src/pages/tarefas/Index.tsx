import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Calendar, 
  Check,
  Circle,
  X,
  Trash2,
  Clock,
  MoreVertical,
  Search,
  Hash,
  FileText,
  Link2,
  Settings,
  Type,
  Layout,
  Calculator,
  Smile,
  Zap,
  Users,
  Save,
  MessageSquare,
  User as UserIcon,
  CheckCircle2,
  Flag,
  File,
  Image as ImageIcon,
  Paperclip,
  Upload,
  Variable
} from 'lucide-react';

// --- Types ---

type ColumnType = 'status' | 'priority' | 'date' | 'text' | 'number' | 'file' | 'formula' | 'link';

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

// --- Constants ---

const STATUS_OPTIONS = ['Feito', 'Trabalhando nisso', 'Parado', 'Não iniciado'];
const STATUS_COLORS: Record<string, string> = {
  'Feito': 'bg-[#00c875]',
  'Trabalhando nisso': 'bg-[#fdab3d]',
  'Parado': 'bg-[#df2f4a]',
  'Não iniciado': 'bg-[#c4c4c4]',
};

const PRIORITY_OPTIONS = ['Urgente', 'Alta', 'Média', 'Baixa'];
const PRIORITY_COLORS: Record<string, string> = {
  'Urgente': 'bg-[#df2f4a]',
  'Alta': 'bg-[#fb275d]',
  'Média': 'bg-[#fdab3d]',
  'Baixa': 'bg-[#579bfc]',
};

const TOOL_CATALOG = [
  {
    category: 'Essenciais',
    items: [
      { id: 'status', label: 'Status', icon: Check, color: 'text-emerald-500', type: 'status' },
      { id: 'text', label: 'Texto', icon: Type, color: 'text-blue-400', type: 'text' },
      { id: 'users', label: 'Pessoas', icon: Users, color: 'text-amber-500', type: 'text' },
      { id: 'date', label: 'Data', icon: Calendar, color: 'text-red-400', type: 'date' },
    ]
  },
  {
    category: 'Super úteis',
    items: [
      { id: 'number', label: 'Números', icon: Hash, color: 'text-emerald-400', type: 'number' },
      { id: 'formula', label: 'Fórmula', icon: Calculator, color: 'text-indigo-500', type: 'formula' },
      { id: 'file', label: 'Arquivos', icon: FileText, color: 'text-amber-600', type: 'file' },
      { id: 'link', label: 'Conectar quadros', icon: Link2, color: 'text-blue-600', type: 'link' },
    ]
  }
];

// --- Main Component ---

const TaskModal = ({ task, columns, onSave, onClose, onChange }: { task: Task; columns: Column[]; onSave: (t: Task) => void; onClose: () => void; onChange: (t: Task) => void }) => {
  try {
    const validColumns = columns?.filter?.((c: Column) => c?.type !== 'formula') || [];
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
        <div className="bg-white border border-neutral-200 rounded-[32px] shadow-2xl w-full max-w-xs md:max-w-2xl overflow-hidden p-4 md:p-10 transform animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-start mb-4 md:mb-8 gap-3">
            <h2 className="text-xl md:text-3xl font-black text-black tracking-tighter">Configurar Tarefa</h2>
            <button onClick={onClose} className="p-1 md:p-2 text-neutral-300 hover:text-black transition-colors flex-shrink-0"><X size={20} className="md:w-6 md:h-6" /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (task?.title) onSave(task);
          }} className="space-y-4 md:space-y-8">
            <div className="space-y-1 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-black text-neutral-400 uppercase">Nome da Tarefa</label>
              <input 
                autoFocus 
                required 
                className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-3 md:px-6 py-2 md:py-4 text-xs md:text-lg font-black" 
                value={task?.title || ''} 
                onChange={(e) => onChange({ ...task, title: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              {validColumns.map((c: Column) => (
                <div key={c.id} className="space-y-1 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-neutral-400 uppercase">{c?.title || ''}</label>
                  <input 
                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-md px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-bold" 
                    value={task?.values?.[c.id] || ''} 
                    onChange={(e) => onChange({ ...task, values: { ...task.values, [c.id]: e.target.value } })} 
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="w-full bg-black text-white py-3 md:py-4 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-xl hover:bg-neutral-800 transition-all">Salvar Tarefa</button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white p-8 rounded-2xl text-center">
          <p className="text-red-500 font-bold mb-4">Erro ao abrir formulário</p>
          <button onClick={onClose} className="px-4 py-2 bg-black text-white rounded-lg">Fechar</button>
        </div>
      </div>
    );
  }
};

const Tarefas = () => {
  const [columns, setColumns] = useState<Column[]>(() => {
    const stored = localStorage.getItem('axium_cols_v4');
    if (stored) return JSON.parse(stored);
    return [
      { id: 'col-status', title: 'Status', type: 'status', width: 140 },
      { id: 'col-budget', title: 'Orçamento', type: 'number', width: 140 },
      { id: 'col-commission', title: 'Comissão', type: 'formula', width: 140, formula: '{Orçamento} * 0.1' },
      { id: 'col-files', title: 'Arquivos', type: 'file', width: 140 },
    ];
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const stored = localStorage.getItem('axium_groups_v4');
    if (stored) return JSON.parse(stored);
    return [
      {
        id: 'g1',
        title: 'Este Mês',
        color: '#579bfc',
        isExpanded: true,
        tasks: [
          { id: '1', title: 'Lead - Clínica Sorriso', values: { 'col-status': 'Trabalhando nisso', 'col-budget': 15000 } },
        ]
      }
    ];
  });

  const [isColumnCenterOpen, setIsColumnCenterOpen] = useState(false);
  const [searchTool, setSearchTool] = useState('');
  const [activeCellMenu, setActiveCellMenu] = useState<{ taskId: string; colId: string; type: string } | null>(null);
  const [editingColHeader, setEditingColHeader] = useState<string | null>(null);
  const [quickAddTitles, setQuickAddTitles] = useState<Record<string, string>>({});
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('g1');
  const [editingFormulaCol, setEditingFormulaCol] = useState<Column | null>(null);

  // Focus management
  const quickAddInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    localStorage.setItem('axium_cols_v4', JSON.stringify(columns));
    localStorage.setItem('axium_groups_v4', JSON.stringify(groups));
  }, [columns, groups]);

  // --- Formula Calculation ---

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
      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      if (isNaN(result) || !isFinite(result)) return 'Erro';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result);
    } catch (e) { return 'Erro'; }
  }, [columns]);

  // --- File Upload Component ---

  const FileUploadCell = ({ taskId, colId, value }: { taskId: string; colId: string; value: FileMetadata | null }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const processFile = (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const metadata: FileMetadata = {
          name: file.name, type: file.type, size: file.size,
          preview: file.type.startsWith('image/') ? (reader.result as string) : undefined
        };
        updateTaskValue(taskId, colId, metadata);
      };
      reader.readAsDataURL(file);
    };
    if (value) {
      return (
        <div className="h-9 group/file relative flex items-center gap-2 px-2 bg-neutral-50 rounded-md border border-neutral-100 overflow-hidden shadow-sm mx-auto w-[90%]">
          {value.preview ? <img src={value.preview} className="w-6 h-6 rounded object-cover" alt="p" /> : <FileText size={16} className="text-blue-500" />}
          <span className="text-[10px] font-bold text-neutral-600 truncate flex-1">{value.name}</span>
          <button onClick={() => updateTaskValue(taskId, colId, null)} className="p-1 text-neutral-300 hover:text-red-500 hover:bg-white rounded-md transition-all"><X size={12} /></button>
        </div>
      );
    }
    return (
      <div onClick={() => fileInputRef.current?.click()} className="h-9 w-[90%] mx-auto flex items-center justify-center border-2 border-dashed border-neutral-100 rounded-md transition-all cursor-pointer group/upload hover:border-black hover:bg-neutral-50/50">
        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) processFile(f); }} />
        <Upload size={12} className="text-neutral-200 group-hover/upload:text-black group-hover/upload:animate-bounce" />
      </div>
    );
  };

  // --- Handlers ---

  const updateTaskValue = (taskId: string, colId: string, value: any) => {
    setGroups(prev => prev.map(g => ({
      ...g,
      tasks: g.tasks.map(t => t.id === taskId ? { ...t, values: { ...t.values, [colId]: value } } : t)
    })));
    setActiveCellMenu(null);
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

  const addColumn = (tool: any) => {
    const newId = `col-${Math.random().toString(36).substring(2, 9)}`;
    setColumns([...columns, { id: newId, title: tool.label, type: tool.type, width: 140, formula: tool.type === 'formula' ? '' : undefined }]);
    setIsColumnCenterOpen(false);
  };

  // --- Stats ---
  const allTasks = groups.flatMap(g => g.tasks);
  const totalTasksCount = allTasks.length;
  const doneTasksCount = allTasks.filter(t => t.values['col-status'] === 'Feito').length;

  const filteredTools = searchTool
    ? TOOL_CATALOG.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.label.toLowerCase().includes(searchTool.toLowerCase()))
      })).filter(cat => cat.items.length > 0)
    : TOOL_CATALOG;

  // --- Render Helpers ---

  return (
    <div className="bg-white min-h-screen text-black">
      {/* Header */}
      <div className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2 md:px-4 pt-2 md:pt-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Operações Axium</h1>
          <p className="text-neutral-500 text-xs md:text-sm font-medium">Gestão dinâmica de alto desempenho.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-10 w-full md:w-auto">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="text-right">
              <p className="text-[9px] md:text-[10px] text-neutral-400 font-black uppercase tracking-widest">Progresso</p>
              <p className="text-lg md:text-xl font-black">{totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0}%</p>
            </div>
            <div className="w-24 md:w-40 h-1.5 md:h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 0}%` }} />
            </div>
          </div>
          <button 
            onClick={() => { setTargetGroupId('g1'); setEditingTask({ id: Math.random().toString(36).substring(2, 9), title: '', values: {} }); setIsTaskModalOpen(true); }}
            className="flex-1 sm:flex-none bg-black text-white px-4 md:px-8 py-2 md:py-3.5 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg shadow-black/10 whitespace-nowrap"
          >
            <Plus size={14} className="md:w-4.5 md:h-4.5 inline mr-1 md:mr-2" strokeWidth={3} /> <span className="hidden sm:inline">Nova Tarefa</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Board Groups */}
      <div className="space-y-6 md:space-y-12 px-2 md:px-4 pb-20 md:pb-40">
        {groups.map(group => (
          <div key={group.id}>
            <div className="flex items-center gap-2 mb-2 md:mb-4 cursor-pointer group/header" onClick={() => setGroups(prev => prev.map(g => g.id === group.id ? { ...g, isExpanded: !g.isExpanded } : g))}>
              <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: group.color }} />
              {group.isExpanded ? <ChevronDown size={16} className="md:w-4.5 md:h-4.5" /> : <ChevronRight size={16} className="md:w-4.5 md:h-4.5" />}
              <h2 className="text-lg md:text-xl font-black transition-all group-hover/header:translate-x-1" style={{ color: group.color }}>{group.title}</h2>
              <span className="text-[10px] md:text-xs text-neutral-300 font-bold ml-1 md:ml-2">{group.tasks.length} itens</span>
            </div>

            {group.isExpanded && (
              <div className="border border-neutral-100 rounded-2xl bg-white shadow-sm overflow-x-auto">
                <table className="w-full border-collapse text-[11px] md:text-sm">
                  <thead>
                    <tr className="bg-neutral-50/30 border-b border-neutral-100 text-[9px] md:text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                      <th className="w-8 md:w-10 p-2 md:p-4 border-r border-neutral-100"><Circle size={12} className="md:w-3.5 md:h-3.5 mx-auto opacity-20" /></th>
                      <th className="text-left p-2 md:p-4 min-w-[180px] md:min-w-[350px]">Tarefa</th>
                      {columns.map(col => (
                        <th key={col.id} className="p-4 border-l border-neutral-100 text-center relative group/col">
                          {editingColHeader === col.id ? (
                            <input autoFocus className="w-full bg-transparent border-none text-center font-black outline-none" value={col.title} onChange={(e) => setColumns(columns.map(c => c.id === col.id ? { ...c, title: e.target.value } : c))} onBlur={() => setEditingColHeader(null)} />
                          ) : (
                            <span onDoubleClick={() => setEditingColHeader(col.id)} className="cursor-pointer">{col.title}</span>
                          )}
                          <button onClick={() => { if(confirm('Excluir?')) setColumns(columns.filter(c => c.id !== col.id)) }} className="absolute right-1 top-4 opacity-0 group-hover/col:opacity-100 text-neutral-300 hover:text-red-500"><X size={10} /></button>
                        </th>
                      ))}
                      <th className="w-12 p-4 border-l border-neutral-100 bg-neutral-50/10 text-center relative overflow-visible">
                        <button onClick={() => setIsColumnCenterOpen(!isColumnCenterOpen)} className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-all text-neutral-400 hover:text-black mx-auto"><Plus size={18} /></button>
                        {isColumnCenterOpen && (
                          <div className="absolute top-12 right-0 z-[100] w-80 bg-white border border-neutral-200 rounded-3xl shadow-2xl overflow-hidden p-5">
                            <div className="relative mb-6"><Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" /><input autoFocus type="text" placeholder="Pesquise sua coluna" className="w-full bg-white border border-neutral-200 rounded-md pl-10 pr-4 py-3 text-xs font-bold" value={searchTool} onChange={(e) => setSearchTool(e.target.value)} /></div>
                            <div className="space-y-6 max-h-96 overflow-y-auto">
                              {filteredTools.map(cat => (
                                <div key={cat.category}><p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">{cat.category}</p><div className="grid grid-cols-2 gap-2">{cat.items.map(tool => (<button key={tool.id} onClick={() => addColumn(tool)} className="flex items-center gap-3 p-3 bg-white border border-neutral-100 rounded-md hover:border-black transition-all text-left"><tool.icon size={16} className={tool.color} /><span className="text-[11px] font-black text-neutral-600">{tool.label}</span></button>))}</div></div>
                              ))}
                            </div>
                          </div>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.tasks.map(task => (
                      <tr key={task.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 group/row transition-colors">
                        <td className="p-4 border-r border-neutral-100 relative text-center">
                          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: group.color }} />
                          <Check size={16} className={`${task.values['col-status'] === 'Feito' ? 'text-emerald-500' : 'text-neutral-100'}`} strokeWidth={3} />
                        </td>
                        <td className="p-4"><input type="text" className="w-full bg-transparent border-none focus:ring-0 font-bold text-neutral-700 outline-none p-0 focus:text-black" value={task.title} onChange={(e) => updateTaskValue(task.id, 'title', e.target.value)} /></td>
                        {columns.map(col => (
                          <td key={col.id} className="p-1 border-l border-neutral-50 relative overflow-visible">
                            {col.type === 'status' && (
                              <div onClick={() => setActiveCellMenu({ taskId: task.id, colId: col.id, type: 'status' })} className={`h-9 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest cursor-pointer ${STATUS_COLORS[task.values[col.id]] || 'bg-neutral-100 text-neutral-400'}`}>{task.values[col.id] || 'Não iniciado'}
                                {activeCellMenu?.taskId === task.id && activeCellMenu.colId === col.id && (
                                  <div className="absolute top-11 left-0 right-0 z-[60] bg-white border border-neutral-200 rounded-md shadow-2xl p-1.5">{STATUS_OPTIONS.map(opt => (<div key={opt} onClick={() => updateTaskValue(task.id, col.id, opt)} className={`p-2.5 mb-1 rounded-md text-[9px] font-black text-white text-center uppercase tracking-widest ${STATUS_COLORS[opt]}`}>{opt}</div>))}</div>
                                )}
                              </div>
                            )}
                            {col.type === 'priority' && (
                              <div onClick={() => setActiveCellMenu({ taskId: task.id, colId: col.id, type: 'priority' })} className={`h-9 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest cursor-pointer ${PRIORITY_COLORS[task.values[col.id]] || 'bg-neutral-100 text-neutral-400'}`}>{task.values[col.id] || '—'}
                                {activeCellMenu?.taskId === task.id && activeCellMenu.colId === col.id && (
                                  <div className="absolute top-11 left-0 right-0 z-[60] bg-white border border-neutral-200 rounded-md shadow-2xl p-1.5">{PRIORITY_OPTIONS.map(opt => (<div key={opt} onClick={() => updateTaskValue(task.id, col.id, opt)} className={`p-2.5 mb-1 rounded-md text-[9px] font-black text-white text-center uppercase tracking-widest ${PRIORITY_COLORS[opt]}`}>{opt}</div>))}</div>
                                )}
                              </div>
                            )}
                            {col.type === 'date' && <input type="date" className="w-full h-9 bg-transparent border-none text-[10px] font-bold text-neutral-400 text-center outline-none" value={task.values[col.id] || ''} onChange={(e) => updateTaskValue(task.id, col.id, e.target.value)} />}
                            {col.type === 'number' && <input type="number" className="w-full h-9 bg-transparent border-none text-[11px] font-black text-black text-center outline-none" value={task.values[col.id] || ''} onChange={(e) => updateTaskValue(task.id, col.id, e.target.value)} />}
                            {col.type === 'file' && <FileUploadCell taskId={task.id} colId={col.id} value={task.values[col.id]} />}
                            {col.type === 'formula' && <div onClick={() => setEditingFormulaCol(col)} className="h-9 flex items-center justify-center text-[11px] font-black text-black tracking-tight cursor-pointer hover:bg-neutral-50/80 transition-all rounded-md">{evaluateFormula(col.formula || '', task.values)}</div>}
                            {col.type === 'text' && <input type="text" className="w-full h-9 bg-transparent border-none text-[11px] font-bold text-neutral-600 text-center outline-none" value={task.values[col.id] || ''} onChange={(e) => updateTaskValue(task.id, col.id, e.target.value)} />}
                          </td>
                        ))}
                        <td className="p-4 border-l border-neutral-100 text-center"><button onClick={() => { if(confirm('Excluir?')) setGroups(prev => prev.map(g => ({ ...g, tasks: g.tasks.filter(t => t.id !== task.id) }))) }} className="text-neutral-200 hover:text-red-500 opacity-0 group-hover/row:opacity-100"><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                    
                    {/* --- Quick Add Functional Row --- */}
                    <tr 
                      className="bg-neutral-50/10 cursor-text"
                      onClick={() => quickAddInputRefs.current[group.id]?.focus()}
                    >
                      <td colSpan={columns.length + 3} className="p-4 border-t border-neutral-50 relative group/quick">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: group.color }} />
                        <div className="flex items-center gap-4 ml-6">
                          <Plus size={16} className={`transition-colors ${quickAddTitles[group.id] ? 'text-black' : 'text-neutral-200'}`} strokeWidth={3} />
                          <input 
                            ref={el => quickAddInputRefs.current[group.id] = el}
                            type="text" 
                            placeholder="+ ADICIONAR TAREFA (Pressione Enter)"
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase tracking-[3px] text-neutral-300 focus:text-black outline-none p-0 placeholder:text-neutral-200 transition-all"
                            value={quickAddTitles[group.id] || ''}
                            onChange={(e) => setQuickAddTitles(prev => ({ ...prev, [group.id]: e.target.value }))}
                            onKeyDown={(e) => handleQuickAdd(group.id, e)}
                          />
                          {quickAddTitles[group.id] && (
                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest animate-pulse">Pressione Enter para salvar</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals & Formula Editor (Re-used for brevity but fully functional) */}
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

      {editingFormulaCol && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-[32px] shadow-2xl w-full max-w-xs md:max-w-lg overflow-hidden p-4 md:p-10 transform animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-start mb-3 md:mb-6 gap-3"><h2 className="text-lg md:text-2xl font-black text-black">Editor de Fórmulas</h2><button onClick={() => setEditingFormulaCol(null)} className="p-1 md:p-2 text-neutral-300 hover:text-black flex-shrink-0"><X size={18} className="md:w-5 md:h-5" /></button></div>
            <textarea className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl p-3 md:p-6 text-xs md:text-base font-black h-24 md:h-32 focus:border-black outline-none" value={editingFormulaCol.formula || ''} onChange={(e) => setEditingFormulaCol({ ...editingFormulaCol, formula: e.target.value })} />
            <div className="mt-4 md:mt-8 flex gap-2 md:gap-4"><button onClick={() => setEditingFormulaCol(null)} className="flex-1 py-2 md:py-4 font-black text-[10px] md:text-[11px] uppercase text-neutral-400 hover:text-neutral-600">Cancelar</button><button onClick={() => { setColumns(columns.map(c => c.id === editingFormulaCol.id ? editingFormulaCol : c)); setEditingFormulaCol(null); }} className="flex-[2] bg-black text-white py-2 md:py-4 rounded-2xl font-black text-[10px] md:text-[11px] uppercase shadow-xl hover:bg-neutral-800">Salvar Fórmula</button></div>
          </div>
        </div>
      )}

      {/* Backdrop for cell menus */}
      {activeCellMenu && <div className="fixed inset-0 z-[50] bg-transparent" onClick={() => setActiveCellMenu(null)} />}
    </div>
  );
};

export default Tarefas;
