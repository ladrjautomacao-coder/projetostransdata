import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Database } from "@/integrations/supabase/types";

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

interface ProjectFiltersContextValue {
  filters: ProjectFilters;
  setFilter: <K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => void;
  clearFilters: () => void;
}

const ProjectFiltersContext = createContext<ProjectFiltersContextValue | null>(null);

export function ProjectFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<ProjectFilters>(defaultFilters);

  const setFilter = useCallback(<K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

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
