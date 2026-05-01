import { useState, useEffect } from 'react';
import { Plus, X, Table2 } from 'lucide-react';
import { useTaskTable } from '../../contexts/TaskTableContext';
import TabelaTarefas from '../../components/tarefas/TabelaTarefas';

const PRESET_COLORS = ['#3b82f6', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#6366f1', '#8b5cf6', '#ec4899'];

const Tarefas = () => {
  const { tables, activeTableId, setActiveTableId, addTable, deleteTable, updateTable } = useTaskTable();
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableColor, setNewTableColor] = useState('#3b82f6');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingTableName, setEditingTableName] = useState('');

  useEffect(() => {
    if (!activeTableId && tables.length > 0) {
      setActiveTableId(tables[0].id);
    }
  }, [tables, activeTableId, setActiveTableId]);

  const handleCreateTable = () => {
    if (!newTableName.trim()) return;
    addTable(newTableName.trim(), newTableColor);
    setNewTableName('');
    setNewTableColor('#3b82f6');
    setShowNewTableModal(false);
  };

  const handleDeleteTable = (tableId: string) => {
    if (tables.length <= 1) {
      alert('É necessário manter pelo menos uma tabela.');
      return;
    }
    if (confirm('Excluir esta tabela e todas as suas tarefas?')) {
      deleteTable(tableId);
    }
  };

  const startEditingTable = (tableId: string, currentName: string) => {
    setEditingTableId(tableId);
    setEditingTableName(currentName);
  };

  const saveEditingTable = () => {
    if (editingTableId && editingTableName.trim()) {
      updateTable(editingTableId, { name: editingTableName.trim() });
    }
    setEditingTableId(null);
    setEditingTableName('');
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-neutral-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-neutral-900">Tarefas</h1>
        </div>
        <button
          onClick={() => setShowNewTableModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Nova Tabela
        </button>
      </div>

      {tables.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Table2 size={16} className="text-neutral-400 shrink-0" />
          {tables.map((table) => (
            <div key={table.id} className="flex items-center gap-1">
              {editingTableId === table.id ? (
                <input
                  type="text"
                  value={editingTableName}
                  onChange={(e) => setEditingTableName(e.target.value)}
                  onBlur={saveEditingTable}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEditingTable(); if (e.key === 'Escape') setEditingTableId(null); }}
                  className="px-3 py-1.5 text-sm border border-blue-500 rounded-lg outline-none bg-white"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setActiveTableId(table.id)}
                  onDoubleClick={() => startEditingTable(table.id, table.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTableId === table.id
                      ? 'bg-white border-2 border-blue-500 text-blue-700 shadow-sm'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: table.color }} />
                  {table.name}
                  <span className="text-xs text-neutral-400">({table.tasks.length})</span>
                </button>
              )}
              {tables.length > 1 && (
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-1 text-neutral-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTableId && <TabelaTarefas tableId={activeTableId} />}

      {showNewTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowNewTableModal(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900">Nova Tabela</h3>
              <button onClick={() => setShowNewTableModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Nome da Tabela</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Ex: Projetos, Vendas, Leads..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-900"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTableColor(color)}
                      className={`w-10 h-10 rounded-full transition-all ${
                        newTableColor === color ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowNewTableModal(false)}
                className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTable}
                disabled={!newTableName.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Tabela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tarefas;
