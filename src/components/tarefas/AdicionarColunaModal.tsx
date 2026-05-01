import { useState, type FormEvent } from 'react';
import { X, Plus, Type, Hash, ListChecks, User, Calendar, StickyNote, Tags, Flag } from 'lucide-react';
import type { ColumnType } from '../../contexts/TaskTableContext';

interface ColumnTypeOption {
  type: ColumnType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const COLUMN_TYPE_OPTIONS: ColumnTypeOption[] = [
  { type: 'text', label: 'Texto', icon: <Type size={18} />, description: 'Input de texto simples' },
  { type: 'number', label: 'Numero', icon: <Hash size={18} />, description: 'Input numerico' },
  { type: 'status', label: 'Status', icon: <ListChecks size={18} />, description: 'Select com opcoes' },
  { type: 'priority', label: 'Prioridade', icon: <Flag size={18} />, description: 'Select com nivel de urgencia' },
  { type: 'person', label: 'Pessoa', icon: <User size={18} />, description: 'Select de funcionarios' },
  { type: 'date', label: 'Data', icon: <Calendar size={18} />, description: 'Input de data' },
  { type: 'notes', label: 'Notas', icon: <StickyNote size={18} />, description: 'Textarea multiline' },
  { type: 'tags', label: 'Tags', icon: <Tags size={18} />, description: 'Input multiplo' },
];

interface AdicionarColunaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; type: ColumnType; width: number; statusOptions?: string[]; priorityOptions?: string[] }) => void;
}

const AdicionarColunaModal = ({ isOpen, onClose, onAdd }: AdicionarColunaModalProps) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<ColumnType>('text');
  const [width, setWidth] = useState(150);
  const [statusOptions, setStatusOptions] = useState<string[]>(['Pendente', 'Em Progresso', 'Concluido']);
  const [priorityOptions, setPriorityOptions] = useState<string[]>(['Baixa', 'Media', 'Alta', 'Urgente']);
  const [newOption, setNewOption] = useState('');

  if (!isOpen) return null;

  const handleAddOption = (optionType: 'status' | 'priority') => {
    if (newOption.trim()) {
      if (optionType === 'status' && !statusOptions.includes(newOption.trim())) {
        setStatusOptions([...statusOptions, newOption.trim()]);
      } else if (optionType === 'priority' && !priorityOptions.includes(newOption.trim())) {
        setPriorityOptions([...priorityOptions, newOption.trim()]);
      }
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number, optionType: 'status' | 'priority') => {
    if (optionType === 'status') {
      setStatusOptions(statusOptions.filter((_, i) => i !== index));
    } else {
      setPriorityOptions(priorityOptions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      type: selectedType,
      width,
      statusOptions: selectedType === 'status' ? statusOptions : undefined,
      priorityOptions: selectedType === 'priority' ? priorityOptions : undefined,
    });
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setSelectedType('text');
    setWidth(150);
    setStatusOptions(['Pendente', 'Em Progresso', 'Concluido']);
    setPriorityOptions(['Baixa', 'Media', 'Alta', 'Urgente']);
    setNewOption('');
    onClose();
  };

  const handleTypeChange = (type: ColumnType) => {
    setSelectedType(type);
    if (type !== 'status' && type !== 'priority') {
      setStatusOptions([]);
      setPriorityOptions([]);
    } else if (type === 'status' && statusOptions.length === 0) {
      setStatusOptions(['Pendente', 'Em Progresso', 'Concluido']);
    } else if (type === 'priority' && priorityOptions.length === 0) {
      setPriorityOptions(['Baixa', 'Media', 'Alta', 'Urgente']);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-900">Adicionar Coluna</h3>
          <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Nome da Coluna</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Status da Aprovação"
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-neutral-900"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">Tipo da Coluna</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COLUMN_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => handleTypeChange(option.type)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    selectedType === option.type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                  }`}
                >
                  {option.icon}
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedType === 'status' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Opcoes de Status</label>
              <div className="space-y-2 mb-3">
                {statusOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="flex-1 text-sm text-neutral-700">{option}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index, 'status')}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption('status'); } }}
                  placeholder="Nova opcao..."
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddOption('status')}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {selectedType === 'priority' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Opcoes de Prioridade</label>
              <div className="space-y-2 mb-3">
                {priorityOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      option === 'Urgente' ? 'bg-red-500' :
                      option === 'Alta' ? 'bg-orange-500' :
                      option === 'Media' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="flex-1 text-sm text-neutral-700">{option}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index, 'priority')}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption('priority'); } }}
                  placeholder="Nova opcao..."
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddOption('priority')}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Largura (px)</label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Math.max(50, Number(e.target.value)))}
              min={50}
              max={500}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-neutral-900"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar Coluna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdicionarColunaModal;
