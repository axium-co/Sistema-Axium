import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface FilterState {
  responsible: string | null;
  status: string | null;
  origin: string | null;
  priority: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

interface FilterContextType {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const defaultFilters: FilterState = {
  responsible: null,
  status: null,
  origin: null,
  priority: null,
  dateFrom: null,
  dateTo: null,
};

const RESPONSIBLES = ['João Silva', 'Maria Santos', 'Carlos Souza', 'Ana Oliveira', 'Pedro Lima', 'Julia Costa'];
const STATUSES = ['Não iniciado', 'Em andamento', 'Feito', 'Parado'];
const ORIGINS = ['Orgânico', 'Indicação', 'Facebook', 'Instagram', 'Google', 'Telefone', 'Outros'];
const PRIORITIES = ['Baixa', 'Média', 'Alta'];

function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_filters');
      if (stored) return JSON.parse(stored);
    }
    return defaultFilters;
  });

  useEffect(() => {
    localStorage.setItem('crm_filters', JSON.stringify(filters));
  }, [filters]);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  return (
    <FilterContext.Provider value={{ filters, setFilter, clearFilters, hasActiveFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    return { ...defaultFilters, setFilter: () => {}, clearFilters: () => {}, hasActiveFilters: false };
  }
  return context;
}

export { FilterProvider, useFilters, RESPONSIBLES, STATUSES, ORIGINS, PRIORITIES };