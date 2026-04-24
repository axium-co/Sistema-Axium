import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Users, CheckCircle2, Flag, StickyNote, FileText, Calendar, LayoutGrid, BarChart3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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

interface Column {
  id: string;
  title: string;
  type: string;
  width: number;
}

const STATUS_OPTIONS = ['Não iniciado', 'Em andamento', 'Feito', 'Parado'];
const PRIORITY_OPTIONS = ['Baixa', 'Média', 'Alta'];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Baixa': return 'bg-green-500';
    case 'Média': return 'bg-yellow-500';
    case 'Alta': return 'bg-red-500';
    default: return 'bg-neutral-200';
  }
};

const getPriorityTextColor = (priority: string) => {
  switch (priority) {
    case 'Baixa': return 'text-green-700';
    case 'Média': return 'text-yellow-700';
    case 'Alta': return 'text-red-700';
    default: return 'text-neutral-600';
  }
};

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-tarefa', title: 'Tarefa', type: 'text', width: 200 },
  { id: 'col-responsavel', title: 'Responsável', type: 'users', width: 140 },
  { id: 'col-status', title: 'Status', type: 'status', width: 130 },
  { id: 'col-prioridade', title: 'Prioridade', type: 'priority', width: 100 },
  { id: 'col-notas', title: 'Notas', type: 'notes', width: 150 },
  { id: 'col-arquivos', title: 'Arquivos', type: 'file', width: 80 },
  { id: 'col-data-inicio', title: 'Data de início', type: 'date', width: 120 },
  { id: 'col-prazo', title: 'Prazo de Entrega', type: 'date', width: 130 },
];

const DEFAULT_GROUPS: Group[] = [
  { id: 'g1', title: 'Tarefas Pendentes', color: '#579bfc', isExpanded: true, tasks: [
    { id: '1', title: 'Lead - Clínica Sorriso', values: { 'col-status': 'Em andamento', 'col-prioridade': 'Alta', 'col-prazo': '2026-04-25', 'col-data-inicio': '2026-04-20', 'col-notas': 'Aguardando aprovação' }},
    { id: '2', title: 'Follow-up Cliente XPTO', values: { 'col-status': 'Não iniciado', 'col-prioridade': 'Média', 'col-prazo': '2026-04-30', 'col-data-inicio': '2026-04-22', 'col-notas': '' }},
  ]},
  { id: 'g2', title: 'Concluídos', color: '#00c875', isExpanded: true, tasks: [
    { id: '3', title: 'Projeto Redesign Site', values: { 'col-status': 'Feito', 'col-prioridade': 'Baixa', 'col-prazo': '2026-04-15', 'col-data-inicio': '2026-04-01', 'col-notas': 'Concluído com sucesso' }},
  ]},
];

const ColumnHeader = ({ column, onRename }: { column: Column; onRename: (id: string, newTitle: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.title);

  const handleDoubleClick = () => {
    setEditValue(column.title);
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (editValue.trim() && editValue !== column.title) {
      onRename(column.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-white border-2 border-black rounded px-1 py-0.5 text-[10px] font-black uppercase text-center outline-none"
      />
    );
  }

  return (
    <span 
      onDoubleClick={handleDoubleClick}
      className="cursor-pointer text-[10px] font-black uppercase tracking-widest select-none"
      title="Clique duas vezes para editar"
    >
      {column.title}
    </span>
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

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

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Excluir esta tarefa?')) return;
    onUpdateTasks(group.tasks.filter(t => t.id !== taskId));
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

      <div className="border border-neutral-200 rounded-2xl bg-white overflow-visible">
        <div className="overflow-x-auto" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-10">
                <th className="w-10 p-3 border-r border-neutral-200 bg-neutral-50 sticky left-0 z-20">
                  <button 
                    onClick={toggleAll}
                    className="w-5 h-5 rounded border-2 border-neutral-300 flex items-center justify-center hover:border-black"
                  >
                    {selectedTasks.size === group.tasks.length && group.tasks.length > 0 && <Check size={12} className="text-black" />}
                  </button>
                </th>
                {columns.map(col => (
                  <th 
                    key={col.id} 
                    className="p-3 border-l border-neutral-200 bg-neutral-50 text-center font-semibold text-neutral-600"
                    style={{ minWidth: col.width }}
                  >
                    <ColumnHeader 
                      column={col} 
                      onRename={(id, newTitle) => onUpdateColumns(columns.map(c => c.id === id ? { ...c, title: newTitle } : c))}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.tasks.map(task => (
                <tr key={task.id} className={`border-b ${isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-neutral-100 hover:bg-neutral-50'}`}>
                  <td className={`p-3 border-r border-neutral-200 ${isDark ? 'bg-neutral-800' : 'bg-white'} sticky left-0`}>
                    <button 
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedTasks.has(task.id) ? 'bg-black border-black' : 'border-neutral-300'
                      }`}
                    >
                      {selectedTasks.has(task.id) && <Check size={12} className="text-white" />}
                    </button>
                  </td>
                  <td className={`p-2 border-l border-neutral-200 ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                    <input
                      value={task.title}
                      onChange={(e) => {
                        const updated = group.tasks.map(t => 
                          t.id === task.id ? { ...t, title: e.target.value } : t
                        );
                        onUpdateTasks(updated);
                      }}
                      className={`w-full bg-transparent border-none outline-none font-medium text-sm ${isDark ? 'text-white' : 'text-black'}`}
                    />
                  </td>
                  <td className={`p-2 border-l border-neutral-200 ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                    <input
                      type="text"
                      value={task.values['col-responsavel'] || ''}
                      onChange={(e) => {
                        const updated = group.tasks.map(t => 
                          t.id === task.id ? { ...t, values: { ...t.values, 'col-responsavel': e.target.value } } : t
                        );
                        onUpdateTasks(updated);
                      }}
                      placeholder="Nome..."
                      className={`w-full bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-black'}`}
                    />
                  </td>
                  <td className={`p-2 border-l border-neutral-200 ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                    <select
                      value={task.values['col-status'] || ''}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className={`w-full bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-black'}`}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className={`p-2 border-l border-neutral-200 ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                    <div className="relative">
                      <select
                        value={task.values['col-prioridade'] || ''}
                        onChange={(e) => {
                          const updated = group.tasks.map(t => 
                            t.id === task.id ? { ...t, values: { ...t.values, 'col-prioridade': e.target.value } } : t
                          );
                          onUpdateTasks(updated);
                        }}
                        className={`w-full px-2 py-1 rounded text-sm border-none outline-none cursor-pointer ${getPriorityColor(task.values['col-prioridade'])} ${task.values['col-prioridade'] ? 'text-white font-medium' : 'bg-transparent text-neutral-600'}`}
                      >
                        <option value="" className="bg-white text-neutral-600">—</option>
                        {PRIORITY_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className={`${getPriorityColor(opt)} text-white font-medium`}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className={`p-2 border-l border-neutral-200 ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                    <textarea
                      value={task.values['col-notas'] || ''}
                      onChange={(e) => {
                        const updated = group.tasks.map(t => 
                          t.id === task.id ? { ...t, values: { ...t.values, 'col-notas': e.target.value } } : t
                        );
                        onUpdateTasks(updated);
                      }}
                      placeholder="Notas..."
                      className={`w-full bg-transparent border-none outline-none text-sm resize-none ${isDark ? 'text-white' : 'text-black'}`}
                      rows={1}
                    />
                  </td>
                  <td className={`p-2 border-l border-neutral-200 ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                    <input
                      type="text"
                      value={task.values['col-arquivos'] || ''}
                      onChange={(e) => {
                        const updated = group.tasks.map(t => 
                          t.id === task.id ? { ...t, values: { ...t.values, 'col-arquivos': e.target.value } } : t
                        );
                        onUpdateTasks(updated);
                      }}
                      placeholder="Arquivos..."
                      className={`w-full bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-black'}`}
                    />
                  </td>
                  <td className={`p-2 border-l border-neutral-200 ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                    <input
                      type="date"
                      value={task.values['col-data-inicio'] || ''}
                      onChange={(e) => {
                        const updated = group.tasks.map(t => 
                          t.id === task.id ? { ...t, values: { ...t.values, 'col-data-inicio': e.target.value } } : t
                        );
                        onUpdateTasks(updated);
                      }}
                      className={`w-full bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-black'}`}
                    />
                  </td>
                  <td className={`p-2 border-l border-neutral-200 ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                    <input
                      type="date"
                      value={task.values['col-prazo'] || ''}
                      onChange={(e) => {
                        const updated = group.tasks.map(t => 
                          t.id === task.id ? { ...t, values: { ...t.values, 'col-prazo': e.target.value } } : t
                        );
                        onUpdateTasks(updated);
                      }}
                      className={`w-full bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-black'}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleAddTask}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-all"
        >
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>
    </div>
  );
};

const Tarefas = () => {
  const [currentView, setCurrentView] = useState<'board' | 'reports'>('board');
  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const stored = localStorage.getItem('axium_groups_v2');
      return stored ? JSON.parse(stored) : DEFAULT_GROUPS;
    } catch (e) {
      return DEFAULT_GROUPS;
    }
  });
  const [columns, setColumns] = useState<Column[]>(() => {
    try {
      const stored = localStorage.getItem('axium_cols_fixed');
      return stored ? JSON.parse(stored) : DEFAULT_COLUMNS;
    } catch (e) {
      return DEFAULT_COLUMNS;
    }
  });
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('axium_groups_v2', JSON.stringify(groups));
    } catch (e) {
      console.warn('Failed to save groups to localStorage', e);
    }
  }, [groups]);

  useEffect(() => {
    try {
      localStorage.setItem('axium_cols_fixed', JSON.stringify(columns));
    } catch (e) {
      console.warn('Failed to save columns to localStorage', e);
    }
  }, [columns]);

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
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight">Operações Axium</h1>
          <p className="text-neutral-500 text-sm">Gestão dinâmica de alto desempenho.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl">
          <button
            onClick={() => setCurrentView('board')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              currentView === 'board' ? 'bg-white shadow-sm' : 'text-neutral-500'
            }`}
          >
            <LayoutGrid size={18} className="inline mr-2" />
            Quadro
          </button>
          <button
            onClick={() => setCurrentView('reports')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              currentView === 'reports' ? 'bg-white shadow-sm' : 'text-neutral-500'
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
                className="px-4 py-2 border border-neutral-300 rounded-lg outline-none focus:border-black"
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