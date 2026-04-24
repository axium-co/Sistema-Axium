import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Check, Trash2, X, ChevronDown, Tag, Palette, Calendar, Hash, Text, AlignLeft, Calculator, Paperclip, Users, ListFilter, LayoutGrid } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ColumnOption {
  id: string;
  label: string;
  color: string;
}

interface Column {
  id: string;
  title: string;
  type: 'text' | 'number' | 'status' | 'priority' | 'people' | 'date' | 'tags' | 'notes' | 'files' | 'formula';
  width: number;
  options?: ColumnOption[];
  formula?: string;
  tags?: Tag[];
}

interface Row {
  id: string;
  values: Record<string, any>;
}

interface Board {
  id: string;
  title: string;
  color: string;
  columns: Column[];
  rows: Row[];
}

const COLUMN_TYPES = [
  { id: 'text', label: 'Texto', icon: Text },
  { id: 'number', label: 'Número', icon: Hash },
  { id: 'status', label: 'Status', icon: ListFilter },
  { id: 'priority', label: 'Prioridade', icon: Flag },
  { id: 'people', label: 'Pessoas', icon: Users },
  { id: 'date', label: 'Data', icon: Calendar },
  { id: 'tags', label: 'Etiquetas', icon: Tag },
  { id: 'notes', label: 'Notas', icon: AlignLeft },
  { id: 'files', label: 'Arquivos', icon: Paperclip },
  { id: 'formula', label: 'Fórmula', icon: Calculator },
] as const;

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

const DEFAULT_BOARD: Board = {
  id: 'board-1',
  title: 'Quadro Principal',
  color: '#3b82f6',
  columns: [
    { id: 'col-1', title: 'Tarefa', type: 'text', width: 250 },
  ],
  rows: [],
};

const normalizeText = (text: string) => {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const getDefaultOptions = (type: string): ColumnOption[] => {
  if (type === 'status') {
    return [
      { id: 'Não iniciado', label: 'Não iniciado', color: '#6b7280' },
      { id: 'Em andamento', label: 'Em andamento', color: '#3b82f6' },
      { id: 'Feito', label: 'Feito', color: '#22c55e' },
    ];
  }
  if (type === 'priority') {
    return [
      { id: 'Baixa', label: 'Baixa', color: '#22c55e' },
      { id: 'Média', label: 'Média', color: '#eab308' },
      { id: 'Alta', label: 'Alta', color: '#ef4444' },
    ];
  }
  return [];
};

const ColumnTypeDropdown = ({ 
  position, 
  onSelect, 
  onClose 
}: { 
  position: { top: number; left: number };
  onSelect: (type: Column['type'], label: string) => void;
  onClose: () => void;
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const existingTypes = COLUMN_TYPES.map(ct => ct.id);
  
  return ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden"
      style={{ 
        top: position.top + 4, 
        left: position.left, 
        minWidth: 180,
        maxHeight: 350,
        overflowY: 'auto'
      }}
    >
      <div className="p-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-2">
          Adicionar Coluna
        </p>
        {COLUMN_TYPES.map(ct => {
          const Icon = ct.icon;
          return (
            <button
              key={ct.id}
              onClick={() => onSelect(ct.type as Column['type'], ct.label)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
            >
              <Icon size={16} />
              {ct.label}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

const ColorPicker = ({ 
  color, 
  onChange,
  presetColors = PRESET_COLORS 
}: { 
  color: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}) => {
  return (
    <div className="flex flex-wrap gap-1.5 p-2">
      {presetColors.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : 'hover:scale-110'}`}
          style={{ backgroundColor: c }}
        />
      ))}
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded-full cursor-pointer"
      />
    </div>
  );
};

const Board = ({
  board,
  allBoards,
  onUpdateBoard,
  onDeleteBoard,
  onMoveRow,
}: {
  board: Board;
  allBoards: Board[];
  onUpdateBoard: (board: Board) => void;
  onDeleteBoard: () => void;
  onMoveRow: (rowId: string, fromBoardId: string, toBoardId: string) => void;
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [addColumnPosition, setAddColumnPosition] = useState({ top: 0, left: 0 });
  const addColumnRef = useRef<HTMLButtonElement>(null);

  const handleAddColumn = (type: Column['type'], label: string) => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: label,
      type,
      width: type === 'notes' ? 200 : type === 'files' ? 120 : 150,
      options: ['status', 'priority'].includes(type) ? getDefaultOptions(type) : undefined,
    };
    onUpdateBoard({ ...board, columns: [...board.columns, newColumn] });
    setShowAddColumn(false);
  };

  const handleDeleteColumn = (colId: string) => {
    if (!confirm('Excluir esta coluna?')) return;
    onUpdateBoard({ ...board, columns: board.columns.filter(c => c.id !== colId) });
  };

  const handleColumnRename = (colId: string, newTitle: string) => {
    onUpdateBoard({
      ...board,
      columns: board.columns.map(c => c.id === colId ? { ...c, title: newTitle } : c),
    });
  };

  const handleAddRow = () => {
    const newRow: Row = {
      id: `row-${Date.now()}`,
      values: {},
    };
    onUpdateBoard({ ...board, rows: [...board.rows, newRow] });
  };

  const handleDeleteRow = (rowId: string) => {
    if (!confirm('Excluir esta linha?')) return;
    onUpdateBoard({ ...board, rows: board.rows.filter(r => r.id !== rowId) });
  };

  const handleUpdateRow = (updatedRows: Row[]) => {
    onUpdateBoard({ ...board, rows: updatedRows });
  };

  const handleCellChange = (rowId: string, colId: string, value: any, prevValue?: any) => {
    const updated = board.rows.map(r => 
      r.id === rowId ? { ...r, values: { ...r.values, [colId]: value } } : r
    );
    onUpdateBoard({ ...board, rows: updated });

    const col = board.columns.find(c => c.id === colId);
    if (col?.type === 'status' && prevValue !== value) {
      const targetBoardTitle = normalizeText(value);
      const targetBoard = allBoards.find(b => normalizeText(b.title) === targetBoardTitle && b.id !== board.id);
      if (targetBoard) {
        onMoveRow(rowId, board.id, targetBoard.id);
      }
    }
  };

  const handleAddOption = (colId: string, optionLabel: string) => {
    const col = board.columns.find(c => c.id === colId);
    if (!col || !col.options) return;
    
    const newOption: ColumnOption = {
      id: optionLabel,
      label: optionLabel,
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
    };
    
    onUpdateBoard({
      ...board,
      columns: board.columns.map(c => 
        c.id === colId ? { ...c, options: [...(c.options || []), newOption] } : c
      ),
    });
  };

  const handleUpdateOption = (colId: string, optionId: string, updates: Partial<ColumnOption>) => {
    onUpdateBoard({
      ...board,
      columns: board.columns.map(c => 
        c.id === colId ? { 
          ...c, 
          options: c.options?.map(o => o.id === optionId ? { ...o, ...updates } : o) 
        } : c
      ),
    });
  };

  const handleDeleteOption = (colId: string, optionId: string) => {
    onUpdateBoard({
      ...board,
      columns: board.columns.map(c => 
        c.id === colId ? { ...c, options: c.options?.filter(o => o.id !== optionId) } : c
      ),
    });
  };

  const handleAddTag = (colId: string, tagName: string, tagColor: string) => {
    const col = board.columns.find(c => c.id === colId);
    if (!col || !col.tags) return;
    
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: tagName,
      color: tagColor,
    };
    
    onUpdateBoard({
      ...board,
      columns: board.columns.map(c => 
        c.id === colId ? { ...c, tags: [...(c.tags || []), newTag] } : c
      ),
    });
  };

  const toggleRowSelection = (rowId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === board.rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(board.rows.map(r => r.id)));
    }
  };

  const getOptionColor = (colId: string, value: string) => {
    const col = board.columns.find(c => c.id === colId);
    if (!col?.options) return '#6b7280';
    return col.options.find(o => o.id === value)?.color || '#6b7280';
  };

  const renderCell = (row: Row, col: Column, rowIndex: number) => {
    const value = row.values[col.id] || '';
    const prevValue = row.values[col.id];

    switch (col.type) {
      case 'text':
      case 'people':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            placeholder={col.type === 'people' ? 'Nome...' : 'Texto...'}
            className={`w-full bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-black'}`}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            className={`w-full bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-black'}`}
          />
        );
      
      case 'status':
      case 'priority':
        const options = col.options || [];
        return (
          <select
            value={value}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value, prevValue)}
            className={`w-full px-2 py-1 rounded text-sm border-none outline-none cursor-pointer text-white font-medium`}
            style={{ backgroundColor: value ? getOptionColor(col.id, value) : '#6b7280' }}
          >
            <option value="" className="bg-neutral-500 text-white">—</option>
            {options.map(opt => (
              <option key={opt.id} value={opt.label} style={{ backgroundColor: opt.color }}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            className={`w-full bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-black'}`}
          />
        );
      
      case 'notes':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            rows={1}
            className={`w-full bg-transparent border-none outline-none text-sm resize-none ${isDark ? 'text-white' : 'text-black'}`}
          />
        );
      
      case 'files':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            placeholder="Link ou arquivo..."
            className={`w-full bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-black'}`}
          />
        );
      
      case 'tags':
        const tags = col.tags || [];
        const rowTags = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-1">
            {rowTags.map((tagId: string) => {
              const tag = tags.find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              );
            })}
          </div>
        );
      
      case 'formula':
        return (
          <div className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Fórmula
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-3 h-8 rounded-full cursor-pointer"
          style={{ backgroundColor: board.color }}
          onClick={() => {
            const newColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
            onUpdateBoard({ ...board, color: newColor });
          }}
        />
        <input
          type="text"
          value={board.title}
          onChange={(e) => onUpdateBoard({ ...board, title: e.target.value })}
          className={`text-xl font-black bg-transparent border-none outline-none ${isDark ? 'text-white' : 'text-black'}`}
        />
        <span className="text-xs text-neutral-400 font-medium">{board.rows.length} itens</span>
        <button onClick={onDeleteBoard} className="ml-auto text-neutral-400 hover:text-red-500">
          <Trash2 size={16} />
        </button>
      </div>

      <div className={`border rounded-2xl ${isDark ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-200 bg-white'} overflow-visible`}>
        <div className="overflow-x-auto" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className={`border-b ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-neutral-50'} sticky top-0 z-10`}>
                <th className={`w-10 p-3 border-r ${isDark ? 'border-neutral-700' : 'border-neutral-200'} ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'} sticky left-0 z-20`}>
                  <button 
                    onClick={toggleAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isDark ? 'border-neutral-600 hover:border-white' : 'border-neutral-300 hover:border-black'}`}
                  >
                    {selectedRows.size === board.rows.length && board.rows.length > 0 && <Check size={12} className={isDark ? 'text-white' : 'text-black'} />}
                  </button>
                </th>
                {board.columns.map((col, idx) => (
                  <th 
                    key={col.id} 
                    className={`p-3 border-l ${isDark ? 'border-neutral-700' : 'border-neutral-200'} ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'} text-center`}
                    style={{ minWidth: col.width }}
                  >
                    <div className="flex items-center justify-center gap-1 relative">
                      <input
                        type="text"
                        value={col.title}
                        onChange={(e) => handleColumnRename(col.id, e.target.value)}
                        className={`w-24 text-center text-[10px] font-black uppercase tracking-widest bg-transparent border-none outline-none ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}
                      />
                      {idx > 0 && (
                        <button
                          onClick={() => handleDeleteColumn(col.id)}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className={`p-2 ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                  <button
                    ref={addColumnRef}
                    onClick={(e) => {
                      const rect = addColumnRef.current?.getBoundingClientRect();
                      if (rect) {
                        setAddColumnPosition({ top: rect.bottom, left: rect.left });
                        setShowAddColumn(true);
                      }
                    }}
                    className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-400'}`}
                  >
                    <Plus size={16} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {board.rows.map(row => (
                <tr key={row.id} className={`border-b ${isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-neutral-100 hover:bg-neutral-50'}`}>
                  <td className={`p-3 border-r ${isDark ? 'border-neutral-700' : 'border-neutral-200'} ${isDark ? 'bg-neutral-900' : 'bg-white'} sticky left-0`}>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleRowSelection(row.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedRows.has(row.id) ? 'bg-black border-black' : isDark ? 'border-neutral-600' : 'border-neutral-300'
                        }`}
                      >
                        {selectedRows.has(row.id) && <Check size={12} className="text-white" />}
                      </button>
                      <button onClick={() => handleDeleteRow(row.id)} className="text-neutral-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  {board.columns.map(col => (
                    <td 
                      key={col.id} 
                      className={`p-2 border-l ${isDark ? 'border-neutral-700' : 'border-neutral-200'} ${isDark ? 'bg-neutral-900' : 'bg-white'}`}
                    >
                      {renderCell(row, col, board.rows.indexOf(row))}
                    </td>
                  ))}
                  <td className={`p-2 ${isDark ? 'bg-neutral-900' : 'bg-white'}`} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={handleAddRow}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              isDark 
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                : 'text-neutral-400 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Plus size={16} /> Nova Linha
          </button>
        </div>
      </div>

      {showAddColumn && (
        <ColumnTypeDropdown
          position={addColumnPosition}
          onSelect={handleAddColumn}
          onClose={() => setShowAddColumn(false)}
        />
      )}
    </div>
  );
};

const Tarefas = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [boards, setBoards] = useState<Board[]>(() => {
    try {
      const stored = localStorage.getItem('axium_boards_v3');
      return stored ? JSON.parse(stored) : [DEFAULT_BOARD];
    } catch {
      return [DEFAULT_BOARD];
    }
  });

  useEffect(() => {
    localStorage.setItem('axium_boards_v3', JSON.stringify(boards));
  }, [boards]);

  const handleAddBoard = () => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title: 'Novo Quadro',
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      columns: [
        { id: 'col-1', title: 'Tarefa', type: 'text', width: 250 },
      ],
      rows: [],
    };
    setBoards([...boards, newBoard]);
  };

  const handleDeleteBoard = (boardId: string) => {
    if (!confirm('Excluir este quadro?')) return;
    setBoards(boards.filter(b => b.id !== boardId));
  };

  const handleUpdateBoard = (updatedBoard: Board) => {
    setBoards(boards.map(b => b.id === updatedBoard.id ? updatedBoard : b));
  };

  const handleMoveRow = (rowId: string, fromBoardId: string, toBoardId: string) => {
    const fromBoard = boards.find(b => b.id === fromBoardId);
    const toBoard = boards.find(b => b.id === toBoardId);
    if (!fromBoard || !toBoard) return;

    const row = fromBoard.rows.find(r => r.id === rowId);
    if (!row) return;

    const updatedFromBoard = { ...fromBoard, rows: fromBoard.rows.filter(r => r.id !== rowId) };
    const updatedToBoard = { ...toBoard, rows: [...toBoard.rows, row] };

    setBoards(boards.map(b => 
      b.id === fromBoardId ? updatedFromBoard : 
      b.id === toBoardId ? updatedToBoard : b
    ));
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-black'}`}>
      <div className="max-w-[95%] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
            Tarefas
          </h1>
          <button
            onClick={handleAddBoard}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-all"
          >
            <Plus size={16} /> Adicionar Quadro
          </button>
        </div>

        {boards.map(board => (
          <Board
            key={board.id}
            board={board}
            allBoards={boards}
            onUpdateBoard={handleUpdateBoard}
            onDeleteBoard={() => handleDeleteBoard(board.id)}
            onMoveRow={handleMoveRow}
          />
        ))}

        {boards.length === 0 && (
          <div className="text-center py-20">
            <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Nenhum quadro ainda
            </p>
            <button
              onClick={handleAddBoard}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-all mx-auto"
            >
              <Plus size={16} /> Criar Primeiro Quadro
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tarefas;