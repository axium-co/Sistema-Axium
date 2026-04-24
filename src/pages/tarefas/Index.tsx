import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

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
}

interface Row {
  id: string;
  values: Record<string, unknown>;
}

interface BoardType {
  id: string;
  title: string;
  color: string;
  columns: Column[];
  rows: Row[];
}

const DEFAULT_STATUS_COLUMNS: ColumnOption[] = [
  { id: 'st-1', label: 'Pendente', color: '#6b7280' },
  { id: 'st-2', label: 'Em Andamento', color: '#3b82f6' },
  { id: 'st-3', label: 'Concluído', color: '#22c55e' },
];

const DEFAULT_PRIORITY_COLUMNS: ColumnOption[] = [
  { id: 'pr-1', label: 'Baixa', color: '#94a3b8' },
  { id: 'pr-2', label: 'Média', color: '#f59e0b' },
  { id: 'pr-3', label: 'Alta', color: '#ef4444' },
];

const PRESET_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#3b82f6', '#6366f1', '#8b5cf6'];

const DEFAULT_BOARD: BoardType = {
  id: 'board-1',
  title: 'Quadro Principal',
  color: '#3b82f6',
  columns: [
    { id: 'col-1', title: 'Tarefa', type: 'text', width: 250 },
    { id: 'col-2', title: 'Responsável', type: 'people', width: 150 },
    { id: 'col-3', title: 'Status', type: 'status', width: 140, options: DEFAULT_STATUS_COLUMNS },
    { id: 'col-4', title: 'Prioridade', type: 'priority', width: 120, options: DEFAULT_PRIORITY_COLUMNS },
    { id: 'col-5', title: 'Notas', type: 'notes', width: 200 },
    { id: 'col-6', title: 'Prazo', type: 'date', width: 130 },
  ],
  rows: [],
};

const Board = ({
  board,
  allBoards,
  onUpdateBoard,
  onDeleteBoard,
  onMoveRow,
}: {
  board: BoardType;
  allBoards: BoardType[];
  onUpdateBoard: (board: BoardType) => void;
  onDeleteBoard: () => void;
  onMoveRow: (rowId: string, fromBoardId: string, toBoardId: string) => void;
}) => {
  const handleAddRow = () => {
    const newRow: Row = {
      id: `row-${Date.now()}`,
      values: board.columns.reduce((acc, col) => {
        acc[col.id] = col.type === 'number' ? 0 : '';
        return acc;
      }, {} as Record<string, unknown>),
    };
    onUpdateBoard({ ...board, rows: [...board.rows, newRow] });
  };

  const handleDeleteRow = (rowId: string) => {
    if (!confirm('Excluir esta linha?')) return;
    onUpdateBoard({ ...board, rows: board.rows.filter(r => r.id !== rowId) });
  };

  const handleCellChange = (rowId: string, colId: string, value: unknown) => {
    const updated = board.rows.map(r => 
      r.id === rowId ? { ...r, values: { ...r.values, [colId]: value } } : r
    );
    onUpdateBoard({ ...board, rows: updated });
  };

  const getOptionColor = (colId: string, value: string) => {
    const col = board.columns.find(c => c.id === colId);
    if (!col?.options) return '#6b7280';
    return col.options.find(o => o.label === value)?.color || '#6b7280';
  };

  const renderCell = (row: Row, col: Column) => {
    const value = row.values[col.id] ?? '';

    switch (col.type) {
      case 'text':
      case 'people':
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full min-h-[36px] bg-transparent border-none outline-none text-sm px-3 py-2 text-black hover:bg-neutral-100 focus:bg-neutral-50 focus:border-b-2 focus:border-neutral-400 transition-colors"
            autoComplete="off"
            placeholder="Editar..."
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full min-h-[36px] bg-transparent border-none outline-none text-sm px-3 py-2 text-black hover:bg-neutral-100 focus:bg-neutral-50 focus:border-b-2 focus:border-neutral-400 transition-colors"
            autoComplete="off"
          />
        );
      case 'status':
      case 'priority': {
        const options = col.options || [];
        return (
          <select
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            className="w-full min-h-[36px] px-2 py-1 text-sm border-none outline-none cursor-pointer text-white font-medium"
            style={{ backgroundColor: value ? getOptionColor(col.id, String(value)) : '#6b7280' }}
          >
            <option value="">—</option>
            {options.map(opt => (
              <option key={opt.id} value={opt.label} style={{ backgroundColor: opt.color }}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }
      case 'date':
        return (
          <input
            type="date"
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full min-h-[36px] bg-transparent border-none outline-none text-sm px-3 py-2 text-black hover:bg-neutral-100 focus:bg-neutral-50 transition-colors"
          />
        );
      case 'notes':
        return (
          <textarea
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            rows={1}
            className="w-full min-h-[36px] bg-transparent border-none outline-none text-sm resize-none px-3 py-2 text-black hover:bg-neutral-100 focus:bg-neutral-50 transition-colors"
          />
        );
      default:
        return <div className="text-sm px-3 py-2 text-neutral-400">{String(value) || '—'}</div>;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: board.color }} />
        <h2 className="text-xl font-black text-black">{board.title}</h2>
        <button onClick={onDeleteBoard} className="ml-auto text-neutral-400 hover:text-red-500"><Trash2 size={16} /></button>
      </div>
      <div className="border rounded-2xl border-neutral-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="w-10 p-3 border-r border-neutral-200 text-black">#</th>
                {board.columns.map(col => (
                  <th key={col.id} className="p-3 border-l border-neutral-200 text-left text-[10px] font-black uppercase tracking-widest text-neutral-600" style={{ minWidth: col.width }}>
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.rows.map(row => (
                <tr key={row.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                  <td className="p-3 border-r border-neutral-200 text-center">
                    <button onClick={() => handleDeleteRow(row.id)} className="text-neutral-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                  {board.columns.map(col => (
                    <td key={col.id} className="p-0 border-l border-neutral-200">
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-neutral-200">
          <button onClick={handleAddRow} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg">
            <Plus size={16} /> Nova Linha
          </button>
        </div>
      </div>
    </div>
  );
};

const Tarefas = () => {
  const [boards, setBoards] = useState<BoardType[]>(() => {
    const stored = localStorage.getItem('axium_boards_v3');
    return stored ? JSON.parse(stored) : [DEFAULT_BOARD];
  });

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('#3b82f6');

  useEffect(() => {
    localStorage.setItem('axium_boards_v3', JSON.stringify(boards));
  }, [boards]);

  const handleUpdateBoard = (updatedBoard: BoardType) => {
    setBoards(boards.map(b => b.id === updatedBoard.id ? updatedBoard : b));
  };

  const handleDeleteBoard = (id: string) => {
    if (boards.length > 1 && confirm('Excluir quadro?')) {
      setBoards(boards.filter(b => b.id !== id));
    }
  };

  const handleCreateNewTask = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    
    const newRow: Row = {
      id: `row-${Date.now()}`,
      values: board.columns.reduce((acc, col) => {
        acc[col.id] = col.type === 'number' ? 0 : '';
        return acc;
      }, {} as Record<string, unknown>),
    };
    
    handleUpdateBoard({ ...board, rows: [...board.rows, newRow] });
    setShowCreateTaskModal(false);
  };

  const handleCreateNewBoard = () => {
    if (!newBoardTitle.trim()) return;
    
    const newBoard: BoardType = {
      id: `board-${Date.now()}`,
      title: newBoardTitle,
      color: newBoardColor,
      columns: DEFAULT_BOARD.columns,
      rows: [],
    };
    
    setBoards([...boards, newBoard]);
    setNewBoardTitle('');
    setNewBoardColor('#3b82f6');
    setShowNewBoardModal(false);
  };

  return (
    <div className="p-6 space-y-8 min-h-screen">
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setShowCreateTaskModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white font-black rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Plus size={20} /> Nova Tarefa
        </button>
        <button 
          onClick={() => setShowNewBoardModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-neutral-200 text-black font-black rounded-lg hover:border-black hover:bg-neutral-50 transition-colors"
        >
          <Plus size={20} /> Novo Quadro
        </button>
      </div>

      {boards.map(board => (
        <Board 
          key={board.id} 
          board={board} 
          allBoards={boards} 
          onUpdateBoard={handleUpdateBoard}
          onDeleteBoard={() => handleDeleteBoard(board.id)}
          onMoveRow={() => {}}
        />
      ))}

      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-black mb-6">Qual quadro deseja criar a tarefa?</h3>
            <div className="space-y-3">
              {boards.map(board => (
                <button
                  key={board.id}
                  onClick={() => handleCreateNewTask(board.id)}
                  className="w-full p-4 text-left border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-colors flex items-center gap-3"
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: board.color }} />
                  <span className="font-bold text-black">{board.title}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCreateTaskModal(false)}
              className="w-full mt-6 p-3 border border-neutral-200 rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showNewBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-black mb-6">Criar Novo Quadro</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Nome do Quadro</label>
                <input
                  type="text"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="Ex: Projetos, Vendas, Leads..."
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg font-bold text-black focus:border-black outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewBoardColor(color)}
                      className={`w-10 h-10 rounded-full transition-all ${newBoardColor === color ? 'scale-110 ring-2 ring-offset-2 ring-black' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowNewBoardModal(false)}
                className="flex-1 p-3 border border-neutral-200 rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewBoard}
                disabled={!newBoardTitle.trim()}
                className="flex-1 p-3 bg-black text-white rounded-lg font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Quadro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tarefas;