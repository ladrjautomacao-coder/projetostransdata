import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProjectFilters } from "@/contexts/ProjectFiltersContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Filter, X, Signal, Building2, MapPin, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const statusLabels: Record<ProjectStatus, string> = {
  planejamento: "Planejamento",
  implantacao: "Implantação",
  encerrado: "Encerrado",
  suspenso: "Suspenso",
};

const statusColors: Record<ProjectStatus, { bg: string; border: string; text: string; accent: string }> = {
  planejamento: { bg: "bg-primary/5", border: "border-primary/20", text: "text-primary", accent: "bg-primary" },
  implantacao: { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-600", accent: "bg-amber-500" },
  encerrado: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-600", accent: "bg-emerald-500" },
  suspenso: { bg: "bg-red-500/5", border: "border-red-500/20", text: "text-red-600", accent: "bg-red-500" },
};

interface ProjectRow {
  id: string;
  company_name: string;
  city: string;
  state: string;
  contract_date: string;
  d_zero_date: string | null;
  handover_date: string | null;
  status: ProjectStatus;
  executive: { full_name: string } | null;
  manager: { full_name: string } | null;
  project_solutions: { solution: { name: string } | null }[];
}

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { filters, setFilter, clearFilters } = useProjectFilters();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    supabase.from("team_members").select("id, full_name").eq("role", "gerente_projetos").eq("active", true)
      .then(({ data }) => setManagers(data || []));
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("id, company_name, city, state, contract_date, d_zero_date, handover_date, status, executive:team_members!projects_executive_id_fkey(full_name), manager:team_members!projects_manager_id_fkey(full_name), project_solutions(solution:solutions(name))")
      .order("company_name");
    setProjects((data as unknown as ProjectRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const cities = useMemo(() => {
    const set = new Set(projects.map(p => p.city));
    return Array.from(set).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (filters.managerId) {
      const mgr = managers.find(m => m.id === filters.managerId);
      if (mgr) list = list.filter(p => p.manager?.full_name === mgr.full_name);
    }
    if (filters.companyName) {
      const q = filters.companyName.toLowerCase();
      list = list.filter(p => p.company_name.toLowerCase().includes(q));
    }
    if (filters.state) list = list.filter(p => p.state === filters.state);
    if (filters.city) list = list.filter(p => p.city === filters.city);
    if (filters.status) list = list.filter(p => p.status === filters.status);
    return list;
  }, [projects, filters, managers]);

  const columns = Constants.public.Enums.project_status;

  const grouped = useMemo(() => {
    const map: Record<ProjectStatus, ProjectRow[]> = {
      planejamento: [], implantacao: [], encerrado: [], suspenso: [],
    };
    filtered.forEach(p => map[p.status]?.push(p));
    return map;
  }, [filtered]);

  const fmtDate = (d: string | null) => d ? format(new Date(d + "T00:00:00"), "dd/MM/yyyy") : "—";

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projetos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Signal className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Gestão de Projetos</span>
          </div>
          <h1 className="text-2xl font-bold">Kanban</h1>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} projeto{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Body: Filters + Board */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Sidebar Filters */}
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
                  {columns.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 flex gap-3 min-h-0 overflow-x-auto">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            columns.map(status => {
              const items = grouped[status];
              const colors = statusColors[status];
              return (
                <div key={status} className={`flex-1 min-w-[260px] max-w-[340px] flex flex-col rounded-lg border ${colors.border} ${colors.bg}`}>
                  {/* Column header */}
                  <div className="flex items-center gap-2 p-3 border-b border-border/30">
                    <div className={`h-2.5 w-2.5 rounded-full ${colors.accent}`} />
                    <span className={`text-sm font-semibold ${colors.text}`}>{statusLabels[status]}</span>
                    <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">{items.length}</Badge>
                  </div>

                  {/* Column cards */}
                  <ScrollArea className="flex-1 p-2">
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">Nenhum projeto</p>
                      ) : (
                        items.map(p => (
                          <Card
                            key={p.id}
                            className="cursor-pointer hover:shadow-md transition-shadow border-border/40 bg-card"
                            onClick={() => navigate(`/projetos/${p.id}`)}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <Building2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                <span className="text-sm font-semibold leading-tight">{p.company_name}</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {p.city}/{p.state}
                              </div>

                              {p.manager?.full_name && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {p.manager.full_name}
                                </div>
                              )}

                              {p.d_zero_date && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  D-zero: {fmtDate(p.d_zero_date)}
                                </div>
                              )}

                              {p.project_solutions?.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {p.project_solutions.map((ps, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5">{ps.solution?.name}</Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
