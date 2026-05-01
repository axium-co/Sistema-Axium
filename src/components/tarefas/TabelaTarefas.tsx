import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Trash2, X, StickyNote, Tag, Users } from 'lucide-react';
import { useTaskTable, type TaskColumn, type Task } from '../../contexts/TaskTableContext';
import AdicionarColunaModal from './AdicionarColunaModal';

interface CellEditorProps {
  task: Task;
  column: TaskColumn;
  value: unknown;
  onChange: (value: unknown) => void;
}

const CellEditor = ({ task, column, value, onChange }: CellEditorProps) => {
  const { tables } = useTaskTable();

  const getCellDisplay = () => {
    switch (column.type) {
      case 'status':
        return (
          <select
            value={value ? String(value) : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full px-2 py-1 text-sm border-0 outline-none bg-transparent cursor-pointer"
          >
            <option value="">-</option>
            {(column.statusOptions ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'priority':
        return (
          <select
            value={value ? String(value) : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full px-2 py-1 text-sm border-0 outline-none bg-transparent cursor-pointer"
          >
            <option value="">-</option>
            {(column.priorityOptions ?? ['Baixa', 'Media', 'Alta', 'Urgente']).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'person': {
        const allUsers = tables.flatMap((t) =>
          t.tasks.map((task) => task.customFields[`${column.tableId}-person`] as string | undefined)
        ).filter(Boolean);
        const uniqueUsers = [...new Set(allUsers as string[])];
        return (
          <select
            value={value ? String(value) : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full px-2 py-1 text-sm border-0 outline-none bg-transparent cursor-pointer"
          >
            <option value="">-</option>
            {uniqueUsers.length > 0 ? (
              uniqueUsers.map((user) => (
                <option key={user} value={user}>{user}</option>
              ))
            ) : (
              <>
                <option value="Maria">Maria</option>
                <option value="João">João</option>
                <option value="Pedro">Pedro</option>
                <option value="Ana">Ana</option>
              </>
            )}
          </select>
        );
      }
      case 'date':
        return (
          <input
            type="date"
            value={value ? String(value) : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full px-2 py-1 text-sm border-0 outline-none bg-transparent"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined && value !== null && value !== '' ? String(value) : ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full h-full px-2 py-1 text-sm border-0 outline-none bg-transparent"
          />
        );
      case 'notes':
        return (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openNoteEditor', { detail: { taskId: task.id, columnId: column.id, value: value ? String(value) : '' } }))}
            className="w-full h-full px-2 py-1 text-sm text-left text-neutral-600 hover:text-blue-600 truncate flex items-center gap-1"
          >
            <StickyNote size={12} className="shrink-0" />
            <span className="truncate">{value ? String(value) : 'Adicionar nota...'}</span>
          </button>
        );
      case 'tags': {
        const tags = Array.isArray(value) ? value : (value ? String(value).split(',').filter(Boolean) : []);
        return (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openTagsEditor', { detail: { taskId: task.id, columnId: column.id, tags } }))}
            className="w-full h-full px-2 py-1 flex flex-wrap gap-1 items-center"
          >
            {tags.length > 0 ? (
              tags.map((tag: string, i: number) => (
                <span key={i} className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-neutral-400 text-xs flex items-center gap-1"><Tag size={12} />Adicionar tags...</span>
            )}
          </button>
        );
      }
      default:
        return (
          <input
            type="text"
            value={value ? String(value) : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full px-2 py-1 text-sm border-0 outline-none bg-transparent"
            placeholder="Editar..."
          />
        );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') {
      e.stopPropagation();
    }
  };

  return (
    <div
      className="w-full h-full min-h-[36px]"
      onKeyDown={handleKeyDown}
    >
      {getCellDisplay()}
    </div>
  );
};

interface NoteEditorModalProps {
  isOpen: boolean;
  taskId: string | null;
  columnId: string | null;
  value: string;
  onClose: () => void;
  onSave: (taskId: string, columnId: string, value: string) => void;
}

const NoteEditorModal = ({ isOpen, taskId, columnId, value, onClose, onSave }: NoteEditorModalProps) => {
  const [note, setNote] = useState(value);

  useEffect(() => {
    if (isOpen) setNote(value);
  }, [isOpen, value]);

  if (!isOpen || !taskId || !columnId) return null;

  const handleSave = () => {
    onSave(taskId, columnId, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <StickyNote size={18} />
            Editar Nota
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-neutral-900"
            placeholder="Digite sua nota aqui..."
            autoFocus
          />
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors font-medium">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

interface TagsEditorModalProps {
  isOpen: boolean;
  taskId: string | null;
  columnId: string | null;
  tags: string[];
  onClose: () => void;
  onSave: (taskId: string, columnId: string, tags: string[]) => void;
}

const TagsEditorModal = ({ isOpen, taskId, columnId, tags, onClose, onSave }: TagsEditorModalProps) => {
  const [currentTags, setCurrentTags] = useState<string[]>(tags);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentTags(tags);
      setNewTag('');
    }
  }, [isOpen, tags]);

  if (!isOpen || !taskId || !columnId) return null;

  const addTag = () => {
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      setCurrentTags([...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setCurrentTags(currentTags.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(taskId, columnId, currentTags);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Tag size={18} />
            Editar Tags
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full">
                {tag}
                <button onClick={() => removeTag(index)} className="hover:text-blue-900">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Nova tag..."
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button type="button" onClick={addTag} className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors font-medium">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

interface TabelaTarefasProps {
  tableId: string;
}

const TabelaTarefas = ({ tableId }: TabelaTarefasProps) => {
  const { activeTable, addColumn, deleteColumn, createTask, deleteTask, updateTaskField, updateTask } = useTaskTable();
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [noteEditor, setNoteEditor] = useState<{ taskId: string; columnId: string; value: string } | null>(null);
  const [tagsEditor, setTagsEditor] = useState<{ taskId: string; columnId: string; tags: string[] } | null>(null);

  useEffect(() => {
    const handleOpenNote = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setNoteEditor({ taskId: detail.taskId, columnId: detail.columnId, value: detail.value });
    };
    const handleOpenTags = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTagsEditor({ taskId: detail.taskId, columnId: detail.columnId, tags: detail.tags });
    };
    window.addEventListener('openNoteEditor', handleOpenNote);
    window.addEventListener('openTagsEditor', handleOpenTags);
    return () => {
      window.removeEventListener('openNoteEditor', handleOpenNote);
      window.removeEventListener('openTagsEditor', handleOpenTags);
    };
  }, []);

  if (!activeTable || activeTable.id !== tableId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
        <Users size={48} className="mb-4 text-neutral-300" />
        <p className="text-lg font-medium">Selecione uma tabela para começar</p>
        <p className="text-sm">Crie uma nova tabela ou selecione uma existente</p>
      </div>
    );
  }

  const visibleColumns = activeTable.columns.filter((c) => c.isVisible);

  const handleAddColumn = (data: { name: string; type: 'text' | 'number' | 'status' | 'priority' | 'person' | 'date' | 'notes' | 'tags'; width: number; statusOptions?: string[]; priorityOptions?: string[] }) => {
    addColumn(tableId, {
      name: data.name,
      type: data.type,
      width: data.width,
      isVisible: true,
      order: activeTable.columns.length,
      statusOptions: data.statusOptions,
      priorityOptions: data.priorityOptions,
    });
    setShowColumnModal(false);
  };

  const handleCreateTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTask(tableId, { title: newTaskTitle.trim() });
    setNewTaskTitle('');
    setShowCreateTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Excluir esta tarefa?')) {
      deleteTask(tableId, taskId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: activeTable.color }} />
        <h2 className="text-xl font-bold text-neutral-900">{activeTable.name}</h2>
        <span className="text-sm text-neutral-500">({activeTable.tasks.length} tarefas)</span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Nova Tarefa
          </button>
          <button
            onClick={() => setShowColumnModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
          >
            <Plus size={16} />
            Adicionar Coluna
          </button>
        </div>
      </div>

      {visibleColumns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-neutral-200 rounded-xl">
          <p className="text-neutral-500 mb-4">Nenhuma coluna adicionada</p>
          <button
            onClick={() => setShowColumnModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Adicionar Primeira Coluna
          </button>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="w-12 p-3 border-r border-neutral-200 text-neutral-500 text-xs font-medium">#</th>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.id}
                      className="p-3 border-l border-neutral-200 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide group"
                      style={{ minWidth: col.width }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{col.name}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir a coluna "${col.name}"?`)) {
                              deleteColumn(tableId, col.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500 ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="w-12 p-3 border-l border-neutral-200"></th>
                </tr>
              </thead>
              <tbody>
                {activeTable.tasks.map((task, index) => (
                  <tr key={task.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="p-3 border-r border-neutral-200 text-center text-sm text-neutral-400">
                      {index + 1}
                    </td>
                    {visibleColumns.map((col) => {
                      const isFirstColumn = col === visibleColumns[0];
                      return (
                        <td
                          key={col.id}
                          className={`p-0 border-l border-neutral-100 ${isFirstColumn ? 'font-medium' : ''}`}
                        >
                          {isFirstColumn ? (
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => updateTask(tableId, task.id, { title: e.target.value })}
                              className="w-full h-full min-h-[40px] px-3 py-2 text-sm border-0 outline-none bg-transparent text-neutral-900"
                              placeholder="Nome da tarefa..."
                            />
                          ) : (
                            <CellEditor
                              task={task}
                              column={col}
                              value={task.customFields[col.id]}
                              onChange={(value) => updateTaskField(tableId, task.id, col.id, value)}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 border-l border-neutral-100">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activeTable.tasks.length === 0 && (
            <div className="py-12 text-center text-neutral-500">
              <p className="mb-4">Nenhuma tarefa criada</p>
              <button
                onClick={() => setShowCreateTask(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus size={16} />
                Criar Primeira Tarefa
              </button>
            </div>
          )}
        </div>
      )}

      <AdicionarColunaModal
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        onAdd={handleAddColumn}
      />

      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateTask(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900">Nova Tarefa</h3>
              <button onClick={() => setShowCreateTask(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Nome da Tarefa</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ex: Revisar proposta do cliente"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-900"
                autoFocus
              />
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NoteEditorModal
        isOpen={!!noteEditor}
        taskId={noteEditor?.taskId ?? null}
        columnId={noteEditor?.columnId ?? null}
        value={noteEditor?.value ?? ''}
        onClose={() => setNoteEditor(null)}
        onSave={(taskId, columnId, value) => updateTaskField(tableId, taskId, columnId, value)}
      />

      <TagsEditorModal
        isOpen={!!tagsEditor}
        taskId={tagsEditor?.taskId ?? null}
        columnId={tagsEditor?.columnId ?? null}
        tags={tagsEditor?.tags ?? []}
        onClose={() => setTagsEditor(null)}
        onSave={(taskId, columnId, tags) => updateTaskField(tableId, taskId, columnId, tags)}
      />
    </div>
  );
};

export default TabelaTarefas;
