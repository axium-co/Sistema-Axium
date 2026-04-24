import { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Check, Trash2, X, Calendar, Hash, Text, AlignLeft, Calculator, Paperclip, Users, ListFilter, Flag } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Tag, ColumnOption, Column, Row, Board as BoardType } from '../../lib/taskHelpers';
import { 
  DEFAULT_STATUS_COLUMNS, 
  DEFAULT_PRIORITY_COLUMNS,
  isOverdue,
  parseDate,
  getTaskStats
} from '../../lib/taskHelpers';

const COLUMN_TYPES = [
  { id: 'text', label: 'Texto', icon: Text, type: 'text' },
  { id: 'number', label: 'Número', icon: Hash, type: 'number' },
  { id: 'status', label: 'Status', icon: ListFilter, type: 'status' },
  { id: 'priority', label: 'Prioridade', icon: Flag, type: 'priority' },
  { id: 'people', label: 'Pessoas', icon: Users, type: 'people' },
  { id: 'date', label: 'Data', icon: Calendar, type: 'date' },
  { id: 'tags', label: 'Etiquetas', icon: Tag, type: 'tags' },
  { id: 'notes', label: 'Notas', icon: AlignLeft, type: 'notes' },
  { id: 'files', label: 'Arquivos', icon: Paperclip, type: 'files' },
  { id: 'formula', label: 'Fórmula', icon: Calculator, type: 'formula' },
] as const;

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

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

const normalizeText = (text: string): string => {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
  const isDark = true;
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [addColumnPosition, setAddColumnPosition] = useState({ top: 0, left: 0 });
  const addColumnRef = useRef<HTMLButtonElement>(null);

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

  const handleCellChange = (rowId: string, colId: string, value: unknown, prevValue?: unknown) => {
    const updated = board.rows.map(r => 
      r.id === rowId ? { ...r, values: { ...r.values, [colId]: value } } : r
    );
    onUpdateBoard({ ...board, rows: updated });

    const col = board.columns.find(c => c.id === colId);
    if (col?.type === 'status' && prevValue !== value) {
      const targetBoardTitle = normalizeText(String(value));
      const targetBoard = allBoards.find(b => normalizeText(b.title) === targetBoardTitle && b.id !== board.id);
      if (targetBoard) {
        onMoveRow(rowId, board.id, targetBoard.id);
      }
    }
  };

  const getOptionColor = (colId: string, value: string) => {
    const col = board.columns.find(c => c.id === colId);
    if (!col?.options) return '#6b7280';
    return col.options.find(o => o.label === value)?.color || '#6b7280';
  };

  const renderCell = (row: Row, col: Column) => {
    const value = row.values[col.id] ?? '';
    const prevValue = row.values[col.id];

    switch (col.type) {
      case 'text':
      case 'people':
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            placeholder={col.type === 'people' ? 'Nome...' : 'Texto...'}
            className="w-full min-h-[36px] bg-transparent border-none outline-none text-sm px-3 py-2 text-white placeholder-zinc-500"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            className="w-full min-h-[36px] bg-transparent border-none outline-none text-sm px-3 py-2 text-white"
          />
        );
      case 'status':
      case 'priority':
        const options = col.options || [];
        return (
          <select
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value, prevValue)}
            className="w-full min-h-[36px] px-2 py-1 text-sm border-none outline-none cursor-pointer text-white font-medium"
            style={{ backgroundColor: value ? getOptionColor(col.id, String(value)) : '#6b7280' }}
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
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            className="w-full min-h-[36px] bg-transparent border-none outline-none text-sm px-3 py-2 text-white"
          />
        );
      case 'notes':
        return (
          <textarea
            value={String(value)}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            rows={1}
            className="w-full min-h-[36px] bg-transparent border-none outline-none text-sm resize-none px-3 py-2 text-white"
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
        <h2 className="text-xl font-black text-white">{board.title}</h2>
        <span className="text-xs text-zinc-400">{board.rows.length} itens</span>
        <button onClick={onDeleteBoard} className="ml-auto text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button>
      </div>
      <div className="border rounded-2xl border-zinc-700 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800">
                <th className="w-10 p-3 border-r border-zinc-700 text-white">#</th>
                {board.columns.map(col => (
                  <th key={col.id} className="p-3 border-l border-zinc-700 text-left text-[10px] font-black uppercase tracking-widest text-zinc-300" style={{ minWidth: col.width }}>
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.rows.map(row => (
                <tr key={row.id} className="border-b border-zinc-700 hover:bg-zinc-800">
                  <td className="p-3 border-r border-zinc-700 text-center">
                    <button onClick={() => handleDeleteRow(row.id)} className="text-zinc-500 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                  {board.columns.map(col => (
                    <td key={col.id} className="p-0 border-l border-zinc-700">
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-zinc-700">
          <button onClick={handleAddRow} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
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

  const handleMoveRow = (rowId: string, fromId: string, toId: string) => {
    const fromBoard = boards.find(b => b.id === fromId);
    const toBoard = boards.find(b => b.id === toId);
    const row = fromBoard?.rows.find(r => r.id === rowId);
    if (fromBoard && toBoard && row) {
      handleUpdateBoard({ ...fromBoard, rows: fromBoard.rows.filter(r => r.id !== rowId) });
      handleUpdateBoard({ ...toBoard, rows: [...toBoard.rows, row] });
    }
  };

  return (
    <div className="p-6 space-y-8 bg-black min-h-screen">
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
    </div>
  );
};

export default Tarefas;