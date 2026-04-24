// Tipos para Tarefas
export type TaskStatus = 'pending' | 'in_progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  createdAt?: Date;
  assignedTo?: string;
  tags?: string[];
  notes?: string;
  files?: string;
}

// Tipos para opciones de columnas
export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ColumnOption {
  id: string;
  label: string;
  color: string;
}

export type ColumnType = 'text' | 'number' | 'status' | 'priority' | 'people' | 'date' | 'tags' | 'notes' | 'files' | 'formula';

export interface Column {
  id: string;
  title: string;
  type: ColumnType;
  width: number;
  options?: ColumnOption[];
  formula?: string;
  tags?: Tag[];
}

export interface Row {
  id: string;
  values: Record<string, string | number | Date | string[] | null>;
}

export interface Board {
  id: string;
  title: string;
  color: string;
  columns: Column[];
  rows: Row[];
}

// Utils de validação
export const isValidStatus = (value: unknown): value is TaskStatus => {
  return value === 'pending' || value === 'in_progress' || value === 'done';
};

export const isValidPriority = (value: unknown): value is TaskPriority => {
  return value === 'low' || value === 'medium' || value === 'high';
};

export const normalizeStatus = (value: unknown): TaskStatus => {
  if (!value || typeof value !== 'string') return 'pending';
  
  const normalized = value.toLowerCase().trim();
  
  if (normalized.includes('progress') || normalized.includes('andamento')) return 'in_progress';
  if (normalized.includes('done') || normalized.includes('concluído') || normalized.includes('feito')) return 'done';
  if (normalized.includes('pausado')) return 'pending';
  
  return 'pending';
};

export const normalizePriority = (value: unknown): TaskPriority => {
  if (!value || typeof value !== 'string') return 'medium';
  
  const normalized = value.toLowerCase().trim();
  
  if (normalized.includes('high') || normalized.includes('alta')) return 'high';
  if (normalized.includes('low') || normalized.includes('baixa')) return 'low';
  
  return 'medium';
};

// Utils de data
export const isOverdue = (dueDate: Date | string | undefined | null): boolean => {
  if (!dueDate) return false;
  
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (isNaN(due.getTime())) return false;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return due < now;
};

export const isDueToday = (dueDate: Date | string | undefined | null): boolean => {
  if (!dueDate) return false;
  
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (isNaN(due.getTime())) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return due.toDateString() === today.toDateString();
};

export const isDueThisWeek = (dueDate: Date | string | undefined | null): boolean => {
  if (!dueDate) return false;
  
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (isNaN(due.getTime())) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  
  return due >= today && due <= weekEnd;
};

export const safeFormatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('pt-BR');
};

export const parseDate = (value: string | undefined | null): Date | null => {
  if (!value) return null;
  
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

// Helpers de filtro e agrupamento
export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  unassigned: number;
}

export const getTaskStats = (rows: Row[], columnMap: { statusCol?: Column; ownerCol?: Column; deadlineCol?: Column }): TaskStats => {
  const { statusCol, ownerCol, deadlineCol } = columnMap;
  
  const stats: TaskStats = {
    total: rows.length,
    pending: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0,
    unassigned: 0,
  };
  
  for (const row of rows) {
    const status = statusCol ? (row.values[statusCol.id] as string) || '' : '';
    const owner = ownerCol ? (row.values[ownerCol.id] as string) || '' : '';
    const deadline = deadlineCol ? (row.values[deadlineCol.id] as string) || '' : '';
    
    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus === 'pending') stats.pending++;
    else if (normalizedStatus === 'in_progress') stats.inProgress++;
    else if (normalizedStatus === 'done') stats.done++;
    
    if (!owner) stats.unassigned++;
    
    const dueDate = parseDate(deadline);
    if (isOverdue(dueDate)) stats.overdue++;
    if (isDueToday(dueDate)) stats.dueToday++;
    if (isDueThisWeek(dueDate)) stats.dueThisWeek++;
  }
  
  return stats;
};

export const groupTasksByStatus = (
  rows: Row[], 
  statusCol?: Column
): Record<TaskStatus, Row[]> => {
  const groups: Record<TaskStatus, Row[]> = {
    pending: [],
    in_progress: [],
    done: [],
  };
  
  if (!statusCol) {
    groups.pending = rows;
    return groups;
  }
  
  for (const row of rows) {
    const status = row.values[statusCol.id] as string || '';
    const normalized = normalizeStatus(status);
    
    if (normalized === 'pending') groups.pending.push(row);
    else if (normalized === 'in_progress') groups.in_progress.push(row);
    else if (normalized === 'done') groups.done.push(row);
  }
  
  return groups;
};

export const groupTasksByOwner = (
  rows: Row[], 
  ownerCol?: Column
): Record<string, Row[]> => {
  const groups: Record<string, Row[]> = {
    'Não atribuído': [],
  };
  
  if (!ownerCol) {
    groups['Não atribuído'] = rows;
    return groups;
  }
  
  for (const row of rows) {
    const owner = (row.values[ownerCol.id] as string) || 'Não atribuído';
    
    if (!groups[owner]) {
      groups[owner] = [];
    }
    groups[owner].push(row);
  }
  
  return groups;
};

export const filterTasks = (
  rows: Row[],
  filters: {
    status?: TaskStatus | TaskStatus[];
    priority?: TaskPriority | TaskPriority[];
    owner?: string;
    searchTerm?: string;
    showOverdueOnly?: boolean;
  },
  columnMap: { statusCol?: Column; priorityCol?: Column; ownerCol?: Column }
): Row[] => {
  const { status, priority, owner, searchTerm, showOverdueOnly } = filters;
  const { statusCol, priorityCol, ownerCol } = columnMap;
  
  return rows.filter(row => {
    if (status) {
      const statusArr = Array.isArray(status) ? status : [status];
      const rowStatus = statusCol ? (row.values[statusCol.id] as string) || '' : '';
      const normalized = normalizeStatus(rowStatus);
      if (!statusArr.includes(normalized)) return false;
    }
    
    if (priority) {
      const priorityArr = Array.isArray(priority) ? priority : [priority];
      const rowPriority = priorityCol ? (row.values[priorityCol.id] as string) || '' : '';
      const normalized = normalizePriority(rowPriority);
      if (!priorityArr.includes(normalized)) return false;
    }
    
    if (owner) {
      const rowOwner = ownerCol ? (row.values[ownerCol.id] as string) || '' : '';
      if (rowOwner !== owner) return false;
    }
    
    if (showOverdueOnly) {
      // TODO: implementar filtro de atrasadas
    }
    
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const values = Object.values(row.values).join(' ').toLowerCase();
      if (!values.includes(term)) return false;
    }
    
    return true;
  });
};

// Constantes
export const STATUS_OPTIONS: ColumnOption[] = [
  { id: 'pending', label: 'Não iniciado', color: '#6b7280' },
  { id: 'in_progress', label: 'Em andamento', color: '#3b82f6' },
  { id: 'done', label: 'Concluído', color: '#22c55e' },
];

export const PRIORITY_OPTIONS: ColumnOption[] = [
  { id: 'low', label: 'Baixa', color: '#22c55e' },
  { id: 'medium', label: 'Média', color: '#eab308' },
  { id: 'high', label: 'Alta', color: '#ef4444' },
];

export const DEFAULT_STATUS_COLUMNS: ColumnOption[] = [
  { id: 'Não iniciado', label: 'Não iniciado', color: '#6b7280' },
  { id: 'Em andamento', label: 'Em andamento', color: '#3b82f6' },
  { id: 'Concluído', label: 'Concluído', color: '#22c55e' },
  { id: 'Pausado', label: 'Pausado', color: '#f97316' },
];

export const DEFAULT_PRIORITY_COLUMNS: ColumnOption[] = [
  { id: 'Baixa', label: 'Baixa', color: '#22c55e' },
  { id: 'Média', label: 'Média', color: '#eab308' },
  { id: 'Alta', label: 'Alta', color: '#ef4444' },
];