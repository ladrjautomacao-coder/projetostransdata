import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type BrazilianState = Database["public"]["Enums"]["brazilian_state"];

export interface ProjectFilters {
  managerId: string;
  companyName: string;
  state: string;
  city: string;
  status: string;
}

const defaultFilters: ProjectFilters = {
  managerId: "",
  companyName: "",
  state: "",
  city: "",
  status: "",
};

function loadSavedFilters(key: string | null): ProjectFilters {
  if (!key) return defaultFilters;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultFilters;
    const parsed = JSON.parse(raw) as Partial<ProjectFilters>;
    return {
      managerId: typeof parsed.managerId === "string" ? parsed.managerId : "",
      companyName: typeof parsed.companyName === "string" ? parsed.companyName : "",
      state: typeof parsed.state === "string" ? parsed.state : "",
      city: typeof parsed.city === "string" ? parsed.city : "",
      status: typeof parsed.status === "string" ? parsed.status : "",
    };
  } catch {
    return defaultFilters;
  }
}

interface ProjectFiltersContextValue {
  filters: ProjectFilters;
  setFilter: <K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => void;
  clearFilters: () => void;
}

const ProjectFiltersContext = createContext<ProjectFiltersContextValue | null>(null);

export function ProjectFiltersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = user?.id ? `transdata:kanban-filters:${user.id}` : null;
  const [filters, setFilters] = useState<ProjectFilters>(defaultFilters);
  const [restoredForKey, setRestoredForKey] = useState<string | null>(null);

  // Restaura os filtros salvos assim que o usuário é conhecido
  useEffect(() => {
    if (restoredForKey === storageKey) return;
    setFilters(loadSavedFilters(storageKey));
    setRestoredForKey(storageKey);
  }, [storageKey, restoredForKey]);

  // Persiste automaticamente cada mudança de filtro
  useEffect(() => {
    if (!storageKey || restoredForKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters, storageKey, restoredForKey]);

  const setFilter = useCallback(<K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    if (storageKey) {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
  }, [storageKey]);

  return (
    <ProjectFiltersContext.Provider value={{ filters, setFilter, clearFilters }}>
      {children}
    </ProjectFiltersContext.Provider>
  );
}

export function useProjectFilters() {
  const ctx = useContext(ProjectFiltersContext);
  if (!ctx) throw new Error("useProjectFilters must be used within ProjectFiltersProvider");
  return ctx;
}
