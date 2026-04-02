import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import { statusLabels } from "@/pages/ProjectManagement";

import type { ProjectFilters } from "@/contexts/ProjectFiltersContext";

interface Props {
  filters: ProjectFilters;
  setFilter: <K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  managers: { id: string; full_name: string }[];
  cities: string[];
  columns: readonly string[];
}

export default function KanbanFilters({ filters, setFilter, clearFilters, hasActiveFilters, managers, cities, columns }: Props) {
  return (
    <div className="w-[260px] shrink-0 rounded-lg border border-border/50 bg-card p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" />
          Filtros
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Gerente de Projetos</label>
          <Select value={filters.managerId || undefined} onValueChange={v => setFilter("managerId", v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Projeto</label>
          <Input
            placeholder="Buscar empresa..."
            value={filters.companyName}
            onChange={e => setFilter("companyName", e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado</label>
          <Select value={filters.state || undefined} onValueChange={v => setFilter("state", v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Constants.public.Enums.brazilian_state.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label>
          <Select value={filters.city || undefined} onValueChange={v => setFilter("city", v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <Select value={filters.status || undefined} onValueChange={v => setFilter("status", v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {columns.map(s => <SelectItem key={s} value={s}>{statusLabels[s as keyof typeof statusLabels]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
