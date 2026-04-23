import { useState, useEffect, useRef, createPortal } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Calendar,
  Check,
  X,
  Trash2,
  Search,
  Hash,
  FileText,
  Type,
  Calculator,
  Users,
  CheckCircle2,
  Flag,
  Clock3,
  StickyNote,
  Zap,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';

type ColumnType = 'status' | 'priority' | 'date' | 'number' | 'text' | 'file' | 'timeline' | 'notes' | 'users' | 'formula';

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
const PRIORITY_OPTIONS = ['Baixa', 'Média', 'Alta'];

const TOOL_CATALOG = [
  { category: 'Essenciais', items: [
    { id: 'status', label: 'Status', icon: CheckCircle2, color: 'text-emerald-500', type: 'status' as ColumnType },
    { id: 'priority', label: 'Prioridade', icon: Flag, color: 'text-red-500', type: 'priority' as ColumnType },
    { id: 'date', label: 'Data', icon: Calendar, color: 'text-blue-500', type: 'date' as ColumnType },
    { id: 'users', label: 'Pessoas', icon: Users, color: 'text-amber-500', type: 'users' as ColumnType },
  ]},
  { category: 'Super úteis', items: [
    { id: 'number', label: 'Números', icon: Hash, color: 'text-purple-500', type: 'number' as ColumnType },
    { id: 'formula', label: 'Fórmula', icon: Calculator, color: 'text-indigo-500', type: 'formula' as ColumnType },
    { id: 'file', label: 'Arquivos', icon: FileText, color: 'text-orange-500', type: 'file' as ColumnType },
    { id: 'timeline', label: 'Cronograma', icon: Clock3, color: 'text-cyan-500', type: 'timeline' as ColumnType },
    { id: 'notes', label: 'Notas', icon: StickyNote, color: 'text-yellow-500', type: 'notes' as ColumnType },
    { id: 'text', label: 'Texto', icon: Type, color: 'text-blue-500', type: 'text' as ColumnType },
  ]}
];

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-status', title: 'Status', type: 'status', width: 140 },
  { id: 'col-priority', title: 'Prioridade', type: 'priority', width: 100 },
  { id: 'col-deadline', title: 'Prazo', type: 'date', width: 120 },
  { id: 'col-budget', title: 'Orçamento', type: 'number', width: 120 },
  { id: 'col-notes', title: 'Notas', type: 'notes', width: 80 },
];

const DEFAULT_GROUPS: Group[] = [
  { id: 'g1', title: 'Tarefas Pendentes', color: '#579bfc', isExpanded: true, tasks: [
    { id: '1', title: 'Lead - Clínica Sorriso', values: { 'col-status': 'Em andamento', 'col-priority': 'Alta', 'col-deadline': '2026-04-25', 'col-budget': 15000, 'col-notes': 'Aguardando aprovação' }},
    { id: '2', title: 'Follow-up Cliente XPTO', values: { 'col-status': 'Não iniciado', 'col-priority': 'Média', 'col-deadline': '2026-04-30', 'col-budget': 8500, 'col-notes': '' }},
  ]},
  { id: 'g2', title: 'Concluídos', color: '#00c875', isExpanded: true, tasks: [
    { id: '3', title: 'Projeto Redesign Site', values: { 'col-status': 'Feito', 'col-priority': 'Baixa', 'col-deadline': '2026-04-15', 'col-budget': 12000, 'col-notes': 'Concluído com sucesso' }},
  ]},
];

const normalizeText = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const ColumnDropdown = ({ 
  isOpen, 
  onClose, 
  onAddColumn,
  buttonRef 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAddColumn: (tool: any) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}) => {
  const [search, setSearch] = useState('');
  
  if (!isOpen) return null;

  const filteredTools = TOOL_CATALOG.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.label.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  const dropdownStyle: React.CSSProperties = buttonRef.current
    ? {
        position: 'fixed' as const,
        top: buttonRef.current.getBoundingClientRect().bottom + 8,
        right: Math.max(20, window.innerWidth - buttonRef.current.getBoundingClientRect().right - 360),
        zIndex: 9999,
      }
    : { position: 'fixed' as const, top: 100, right: 20, zIndex: 9999 };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div 
        className="w-[340px] bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden"
        style={dropdownStyle}
      >
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-700">
          <input
            autoFocus
            type="text"
            placeholder="Pesquise ou descreva sua coluna"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-black"
          />
        </div>
        <div className="max-h-[350px] overflow-y-auto">
          {filteredTools.map(cat => (
            <div key={cat.category} className="p-3">
              <div className="flex items-center gap-2 mb-2 px-1">
                {cat.category === 'Essenciais' && <CheckCircle2 size={14} className="text-emerald-500" />}
                {cat.category === 'Super úteis' && <Zap size={14} className="text-amber-500" />}
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{cat.category}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {cat.items.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => onAddColumn(tool)}
                    className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-all text-left"
                  >
                    <tool.icon size={18} className={tool.color} />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
};

const SortableHeaderCell = ({ column, onDelete }: { column: Column; onDelete?: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column.id });
  const isTaskColumn = column.title.toLowerCase() === 'tarefa';

  return (
    <th
      ref={setNodeRef}
      style={{ width: column.width, transform, transition }}
      className="p-3 border-l border-neutral-200 dark:border-neutral-700 text-center font-semibold relative group text-neutral-600 dark:text-neutral-200"
    >
      <div className="flex items-center justify-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest">{column.title}</span>
        {!isTaskColumn && onDelete && (
          <button
            onClick={onDelete}
            className="text-neutral-300 hover:text-red-500 text-xs ml-1 opacity-60 hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </th>
  );
};

const Board = ({ 
  group, 
  columns, 
  onUpdateColumns,
  onUpdateTasks,
  onDeleteGroup,
}: { 
  group: Group; 
  columns: Column[];
  onUpdateColumns: (cols: Column[]) => void;
  onUpdateTasks: (tasks: Task[]) => void;
  onDeleteGroup?: () => void;
}) => {
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleAddColumn = (tool: any) => {
    const exists = columns.some(c => c.type === tool.type);
    if (exists) {
      alert(`Uma coluna "${tool.label}" já existe.`);
      return;
    }
    const newCol: Column = {
      id: `col-${Date.now()}`,
      title: tool.label,
      type: tool.type,
      width: tool.type === 'timeline' ? 180 : 140,
    };
    onUpdateColumns([...columns, newCol]);
    setIsColumnDropdownOpen(false);
  };

  const handleDeleteColumn = (colId: string) => {
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    if (col.title.toLowerCase() === 'tarefa') {
      alert('A coluna TAREFA não pode ser deletada.');
      return;
    }
    if (!confirm(`Deletar coluna "${col.title}"?`)) return;
    onUpdateColumns(columns.filter(c => c.id !== colId));
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const task = group.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTask = { ...task, values: { ...task.values, 'col-status': newStatus } };
    const otherTasks = group.tasks.filter(t => t.id !== taskId);
    onUpdateTasks([...otherTasks, updatedTask]);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedTasks.size === group.tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(group.tasks.map(t => t.id)));
    }
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'Nova Tarefa',
      values: { 'col-status': 'Não iniciado' },
    };
    onUpdateTasks([...group.tasks, newTask]);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: group.color }} />
        <h2 className="text-xl font-black" style={{ color: group.color }}>{group.title}</h2>
        <span className="text-xs text-neutral-400 font-medium">{group.tasks.length} itens</span>
        {onDeleteGroup && (
          <button onClick={onDeleteGroup} className="ml-auto text-neutral-400 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="border border-neutral-200 dark:border-neutral-700 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
                <th className="w-10 p-3 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 sticky left-0 z-20">
                  <button 
                    onClick={toggleAll}
                    className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center hover:border-black"
                  >
                    {selectedTasks.size === group.tasks.length && group.tasks.length > 0 && <Check size={12} className="text-black" />}
                  </button>
                </th>
                <th className="text-left p-3 min-w-[200px] font-semibold sticky left-10 z-10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-200 text-[10px] font-black uppercase">Tarefa</th>
                <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                  {columns.map(col => (
                    <SortableHeaderCell 
                      key={col.id} 
                      column={col} 
                      onDelete={() => handleDeleteColumn(col.id)} 
                    />
                  ))}
                </SortableContext>
                <th className="w-12 p-3 border-l border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <button 
                    ref={addButtonRef}
                    onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                    className="w-7 h-7 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-black"
                  >
                    <Plus size={18} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {group.tasks.map(task => (
                <tr key={task.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <td className="p-3 border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 sticky left-0">
                    <button 
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedTasks.has(task.id) ? 'bg-black border-black' : 'border-neutral-300'
                      }`}
                    >
                      {selectedTasks.has(task.id) && <Check size={12} className="text-white" />}
                    </button>
                  </td>
                  <td className="p-3 sticky left-10 bg-white dark:bg-neutral-900 z-10">
                    <input
                      value={task.title}
                      onChange={(e) => {
                        const updated = group.tasks.map(t => 
                          t.id === task.id ? { ...t, title: e.target.value } : t
                        );
                        onUpdateTasks(updated);
                      }}
                      className="bg-transparent outline-none font-medium text-black dark:text-white w-full"
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col.id} className="p-2 border-l border-neutral-200 dark:border-neutral-700">
                      {col.type === 'status' && (
                        <select
                          value={task.values[col.id] || ''}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-sm"
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {col.type === 'priority' && (
                        <select
                          value={task.values[col.id] || ''}
                          onChange={(e) => {
                            const updated = group.tasks.map(t => 
                              t.id === task.id ? { ...t, values: { ...t.values, [col.id]: e.target.value } } : t
                            );
                            onUpdateTasks(updated);
                          }}
                          className="w-full bg-transparent border-none outline-none text-sm"
                        >
                          {PRIORITY_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {(col.type === 'date' || col.type === 'number' || col.type === 'text' || col.type === 'notes') && (
                        <input
                          type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'}
                          value={task.values[col.id] || ''}
                          onChange={(e) => {
                            const updated = group.tasks.map(t => 
                              t.id === task.id ? { ...t, values: { ...t.values, [col.id]: e.target.value } } : t
                            );
                            onUpdateTasks(updated);
                          }}
                          className="w-full bg-transparent border-none outline-none text-sm"
                          placeholder={col.type === 'notes' ? 'Notas...' : ''}
                        />
                      )}
                      {!['status', 'priority', 'date', 'number', 'text', 'notes'].includes(col.type) && (
                        <span className="text-neutral-400 text-xs">-</span>
                      )}
                    </td>
                  ))}
                  <td className="border-l border-neutral-200 dark:border-neutral-700" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={handleAddTask}
        className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-all"
      >
        <Plus size={16} /> Nova Tarefa
      </button>

      <ColumnDropdown
        isOpen={isColumnDropdownOpen}
        onClose={() => setIsColumnDropdownOpen(false)}
        onAddColumn={handleAddColumn}
        buttonRef={addButtonRef}
      />
    </div>
  );
};

const Tarefas = () => {
  const [currentView, setCurrentView] = useState<'board' | 'reports'>('board');
  const [groups, setGroups] = useState<Group[]>(() => {
    const stored = localStorage.getItem('axium_groups_v2');
    return stored ? JSON.parse(stored) : DEFAULT_GROUPS;
  });
  const [columns, setColumns] = useState<Column[]>(() => {
    const stored = localStorage.getItem('axium_cols_v5');
    return stored ? JSON.parse(stored) : DEFAULT_COLUMNS;
  });
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');

  useEffect(() => {
    localStorage.setItem('axium_groups_v2', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('axium_cols_v5', JSON.stringify(columns));
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleUpdateGroupTasks = (groupId: string, tasks: Task[]) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, tasks } : g));
  };

  const handleAddGroup = () => {
    if (!newGroupTitle.trim()) return;
    const newGroup: Group = {
      id: `g-${Date.now()}`,
      title: newGroupTitle.trim(),
      color: ['#579bfc', '#00c875', '#ffcb00', '#e54b4b', '#9b59b6'][Math.floor(Math.random() * 5)],
      isExpanded: true,
      tasks: [],
    };
    setGroups(prev => [...prev, newGroup]);
    setNewGroupTitle('');
    setIsAddingGroup(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm('Deletar este quadro?')) return;
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">Operações Axium</h1>
          <p className="text-neutral-500 text-sm">Gestão dinâmica de alto desempenho.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
          <button
            onClick={() => setCurrentView('board')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              currentView === 'board' ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm' : 'text-neutral-500'
            }`}
          >
            <LayoutGrid size={18} className="inline mr-2" />
            Quadro
          </button>
          <button
            onClick={() => setCurrentView('reports')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              currentView === 'reports' ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm' : 'text-neutral-500'
            }`}
          >
            <BarChart3 size={18} className="inline mr-2" />
            Painéis
          </button>
        </div>
      </div>

      {currentView === 'board' && (
        <div>
          {isAddingGroup ? (
            <div className="mb-6 flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                placeholder="Nome do novo quadro..."
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg outline-none focus:border-black"
              />
              <button onClick={handleAddGroup} className="px-4 py-2 bg-black text-white rounded-lg font-medium">Adicionar</button>
              <button onClick={() => setIsAddingGroup(false)} className="px-4 py-2 text-neutral-500">Cancelar</button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingGroup(true)}
              className="mb-6 flex items-center gap-2 px-4 py-2 border border-dashed border-neutral-300 rounded-lg text-neutral-400 hover:border-black hover:text-black transition-all"
            >
              <Plus size={16} /> Adicionar quadro
            </button>
          )}

          {groups.map(group => (
            <Board
              key={group.id}
              group={group}
              columns={columns}
              onUpdateColumns={setColumns}
              onUpdateTasks={(tasks) => handleUpdateGroupTasks(group.id, tasks)}
              onDeleteGroup={() => handleDeleteGroup(group.id)}
            />
          ))}
        </div>
      )}

      {currentView === 'reports' && (
        <div className="text-center py-20 text-neutral-400">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Painéis em breve...</p>
        </div>
      )}
    </div>
  );
};

export default Tarefas;
