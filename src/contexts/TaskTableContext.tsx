import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { generateUUID } from '../lib/uuid';

export type ColumnType = 'text' | 'number' | 'status' | 'priority' | 'person' | 'date' | 'notes' | 'tags';

export interface TaskColumn {
  id: string;
  tableId: string;
  name: string;
  type: ColumnType;
  width: number;
  isVisible: boolean;
  order: number;
  statusOptions?: string[];
  priorityOptions?: string[];
}

export interface Task {
  id: string;
  tableId: string;
  title: string;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTable {
  id: string;
  name: string;
  color: string;
  columns: TaskColumn[];
  tasks: Task[];
}

interface TaskTableContextType {
  tables: TaskTable[];
  activeTableId: string | null;
  activeTable: TaskTable | null;
  setActiveTableId: (id: string) => void;
  addColumn: (tableId: string, columnData: Omit<TaskColumn, 'id' | 'tableId'>) => void;
  updateColumn: (tableId: string, columnId: string, data: Partial<TaskColumn>) => void;
  deleteColumn: (tableId: string, columnId: string) => void;
  createTask: (tableId: string, taskData?: { title?: string; customFields?: Record<string, unknown> }) => Task;
  updateTask: (tableId: string, taskId: string, data: Partial<Task>) => void;
  updateTaskField: (tableId: string, taskId: string, columnId: string, value: unknown) => void;
  deleteTask: (tableId: string, taskId: string) => void;
  addTable: (name: string, color: string) => void;
  deleteTable: (tableId: string) => void;
  updateTable: (tableId: string, data: Partial<TaskTable>) => void;
}

const TaskTableContext = createContext<TaskTableContextType | undefined>(undefined);

const STORAGE_KEY = 'task_tables_v1';

const loadTables = (): TaskTable[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
};

const saveTables = (tables: TaskTable[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
};

export const TaskTableProvider = ({ children }: { children: ReactNode }) => {
  const [tables, setTables] = useState<TaskTable[]>(loadTables);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  useEffect(() => {
    saveTables(tables);
  }, [tables]);

  const activeTable = activeTableId ? tables.find(t => t.id === activeTableId) ?? null : null;

  const addColumn = useCallback((tableId: string, columnData: Omit<TaskColumn, 'id' | 'tableId'>) => {
    setTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;
      const maxOrder = table.columns.reduce((max, c) => Math.max(max, c.order), -1);
      const newColumn: TaskColumn = {
        id: generateUUID(),
        tableId,
        ...columnData,
        order: maxOrder + 1,
      };
      return { ...table, columns: [...table.columns, newColumn] };
    }));
  }, []);

  const updateColumn = useCallback((tableId: string, columnId: string, data: Partial<TaskColumn>) => {
    setTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;
      return {
        ...table,
        columns: table.columns.map(col => col.id === columnId ? { ...col, ...data } : col),
      };
    }));
  }, []);

  const deleteColumn = useCallback((tableId: string, columnId: string) => {
    setTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;
      const updatedTasks = table.tasks.map(task => {
        const newFields = { ...task.customFields };
        delete newFields[columnId];
        return { ...task, customFields: newFields, updatedAt: new Date().toISOString() };
      });
      return {
        ...table,
        columns: table.columns.filter(col => col.id !== columnId),
        tasks: updatedTasks,
      };
    }));
  }, []);

  const createTask = useCallback((tableId: string, taskData?: { title?: string; customFields?: Record<string, unknown> }): Task => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateUUID(),
      tableId,
      title: taskData?.title ?? '',
      customFields: taskData?.customFields ?? {},
      createdAt: now,
      updatedAt: now,
    };
    setTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;
      return { ...table, tasks: [...table.tasks, newTask] };
    }));
    return newTask;
  }, []);

  const updateTask = useCallback((tableId: string, taskId: string, data: Partial<Task>) => {
    setTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;
      return {
        ...table,
        tasks: table.tasks.map(task =>
          task.id === taskId ? { ...task, ...data, updatedAt: new Date().toISOString() } : task
        ),
      };
    }));
  }, []);

  const updateTaskField = useCallback((tableId: string, taskId: string, columnId: string, value: unknown) => {
    setTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;
      return {
        ...table,
        tasks: table.tasks.map(task =>
          task.id === taskId
            ? { ...task, customFields: { ...task.customFields, [columnId]: value }, updatedAt: new Date().toISOString() }
            : task
        ),
      };
    }));
  }, []);

  const deleteTask = useCallback((tableId: string, taskId: string) => {
    setTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;
      return { ...table, tasks: table.tasks.filter(t => t.id !== taskId) };
    }));
  }, []);

  const addTable = useCallback((name: string, color: string) => {
    const newTable: TaskTable = {
      id: generateUUID(),
      name,
      color,
      columns: [],
      tasks: [],
    };
    setTables(prev => [...prev, newTable]);
    setActiveTableId(newTable.id);
  }, []);

  const deleteTable = useCallback((tableId: string) => {
    setTables(prev => {
      const filtered = prev.filter(t => t.id !== tableId);
      if (activeTableId === tableId) {
        setActiveTableId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [activeTableId]);

  const updateTable = useCallback((tableId: string, data: Partial<TaskTable>) => {
    setTables(prev => prev.map(table =>
      table.id === tableId ? { ...table, ...data } : table
    ));
  }, []);

  return (
    <TaskTableContext.Provider value={{
      tables,
      activeTableId,
      activeTable,
      setActiveTableId,
      addColumn,
      updateColumn,
      deleteColumn,
      createTask,
      updateTask,
      updateTaskField,
      deleteTask,
      addTable,
      deleteTable,
      updateTable,
    }}>
      {children}
    </TaskTableContext.Provider>
  );
};

export const useTaskTable = () => {
  const context = useContext(TaskTableContext);
  if (context === undefined) {
    throw new Error('useTaskTable must be used within a TaskTableProvider');
  }
  return context;
};
