import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProjectFilters } from "@/contexts/ProjectFiltersContext";
import { useSettings } from "@/contexts/SettingsContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import KanbanFilters from "@/components/kanban/KanbanFilters";
import { ProjectFollowUpCard } from "@/components/comercial/ProjectFollowUpCard";
import { ProjectFollowUpDrawer } from "@/components/comercial/ProjectFollowUpDrawer";
import { ProjectFollowUpSkeleton } from "@/components/comercial/ProjectFollowUpSkeleton";
import { latestFollowUpNote, daysSince } from "@/lib/followUpNotes";
import { Constants } from "@/integrations/supabase/types";
import { statusLabels } from "@/pages/ProjectManagement";
import { Search, RefreshCw, Signal, AlertTriangle, Radio } from "lucide-react";
import type { FollowUpProject, ProjectStatus } from "@/components/comercial/types";

const PAGE_SIZE = 24;

const SELECT_COLS =
  "id, company_name, project_code, city, state, status, sub_phase, contract_date, d_zero_date, handover_date, fleet_size, implemented_fleet, observations, is_pilot, created_at, updated_at, manager_id, executive:team_members!projects_executive_id_fkey(full_name), manager:team_members!projects_manager_id_fkey(full_name), project_solutions(solution:solutions(name)), project_integrations(integration:integrations(name))";

type SortKey = "stale" | "recent" | "company" | "status";

export default function VisaoComercial() {
  const navigate = useNavigate();
  const { filters, setFilter, clearFilters } = useProjectFilters();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { can, loading: permsLoading } = usePermissions();

  const [projects, setProjects] = useState<FollowUpProject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("stale");
  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selected, setSelected] = useState<FollowUpProject | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [liveAt, setLiveAt] = useState<Date | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [staleCount, setStaleCount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const staleDays = settings.stuckDays ?? 30;
  const allowed = permsLoading || can("visao_comercial", "view");
  const mounted = useRef(true);

  useEffect(() => {
    if (!permsLoading && !can("visao_comercial", "view")) navigate("/", { replace: true });
  }, [permsLoading, can, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    supabase.from("team_members").select("id, full_name").eq("role", "gerente_projetos").eq("active", true)
      .then(({ data }) => setManagers(data || []));
    supabase.from("projects").select("city").order("city")
      .then(({ data }) => setCities(Array.from(new Set((data || []).map(p => p.city))).sort()));
  }, []);

  const applyFilters = useCallback(<T,>(q: T): T => {
    let query = q as unknown as ReturnType<typeof supabase.from>["select"] extends never ? never : any;
    if (filters.managerId) query = query.eq("manager_id", filters.managerId);
    if (filters.companyName) query = query.ilike("company_name", `%${filters.companyName}%`);
    if (filters.state) query = query.eq("state", filters.state);
    if (filters.city) query = query.eq("city", filters.city);
    if (filters.status) query = query.eq("status", filters.status);
    if (debouncedSearch) query = query.or(`company_name.ilike.%${debouncedSearch}%,project_code.ilike.%${debouncedSearch}%`);
    return query as T;
  }, [filters, debouncedSearch]);

  const applySort = useCallback((query: any) => {
    switch (sort) {
      case "recent": return query.order("updated_at", { ascending: false });
      case "company": return query.order("company_name", { ascending: true });
      case "status": return query.order("status", { ascending: true }).order("company_name", { ascending: true });
      case "stale":
      default: return query.order("updated_at", { ascending: true });
    }
  }, [sort]);

  const fetchPage = useCallback(async (targetPage: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    let query = supabase.from("projects").select(SELECT_COLS, { count: "exact" });
    query = applyFilters(query);
    query = applySort(query);
    const from = targetPage * PAGE_SIZE;
    const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
    if (!mounted.current) return;
    const rows = (data as unknown as FollowUpProject[]) || [];
    setProjects(prev => (append ? [...prev, ...rows] : rows));
    setTotal(count ?? rows.length);
    setPage(targetPage);
    setLoading(false);
    setLoadingMore(false);
  }, [applyFilters, applySort]);

  const loadSummary = useCallback(async () => {
    const { data } = await supabase.from("projects").select("status, updated_at, observations");
    const rows = (data as { status: string; updated_at: string; observations: string | null }[]) || [];
    const counts: Record<string, number> = {};
    let stale = 0;
    rows.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
      const note = latestFollowUpNote(r.observations);
      const ref = note?.date ? note.date.toISOString() : r.updated_at;
      if ((daysSince(ref) ?? 0) > staleDays) stale += 1;
    });
    if (!mounted.current) return;
    setStatusCounts(counts);
    setStaleCount(stale);
    setGrandTotal(rows.length);
  }, [staleDays]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => { if (user) fetchPage(0, false); }, [user, fetchPage]);
  useEffect(() => { if (user) loadSummary(); }, [user, loadSummary]);

  // Realtime: novas notas e mudanças de status feitas pelo gerente
  useEffect(() => {
    const channel = supabase
      .channel("visao-comercial-projects")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        setLiveAt(new Date());
        fetchPage(0, false);
        loadSummary();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPage, loadSummary]);

  const hasActiveFilters = Object.values(filters).some(v => v !== "") || search !== "";
  const hasMore = projects.length < total;

  const openProject = (p: FollowUpProject) => { setSelected(p); setDrawerOpen(true); };

  const kpis = useMemo(() => Constants.public.Enums.project_status.map(s => ({
    key: s as ProjectStatus,
    label: statusLabels[s as ProjectStatus],
    value: statusCounts[s] || 0,
  })), [statusCounts]);

  if (!allowed) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Signal className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Visão Comercial</span>
          </div>
          <h1 className="text-2xl font-bold">Acompanhamento de Projetos</h1>
          <p className="text-xs text-muted-foreground">Somente leitura — atualizações registradas pelos gerentes de projetos.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {liveAt && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600">
              <Radio className="h-3 w-3" /> atualizado agora
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => { fetchPage(0, false); loadSummary(); }}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-border/60">
          <CardContent className="p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{grandTotal}</p>
          </CardContent>
        </Card>
        {kpis.map(k => (
          <Card key={k.key} className="border-border/60">
            <CardContent className="p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="text-xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3">
            <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-destructive">
              <AlertTriangle className="h-3 w-3" /> +{staleDays} dias
            </p>
            <p className="text-xl font-bold text-destructive">{staleCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="hidden lg:block">
          <KanbanFilters
            filters={filters}
            setFilter={setFilter}
            clearFilters={() => { clearFilters(); setSearch(""); }}
            hasActiveFilters={hasActiveFilters}
            managers={managers}
            cities={cities}
            columns={Constants.public.Enums.project_status}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por empresa ou código do projeto..."
                className="pl-9"
              />
            </div>
            <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[230px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stale">Mais tempo sem atualização</SelectItem>
                <SelectItem value="recent">Última atualização</SelectItem>
                <SelectItem value="company">Nome da empresa</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{total} projeto{total !== 1 ? "s" : ""}</Badge>
            {hasActiveFilters && <span>filtros ativos</span>}
          </div>

          {loading ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <ProjectFollowUpSkeleton key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              type="search"
              title="Nenhum projeto encontrado"
              description="Ajuste ou limpe os filtros e a busca para ver os projetos em andamento."
            />
          ) : (
            <>
              <div className="grid gap-3 xl:grid-cols-2">
                {projects.map(p => (
                  <ProjectFollowUpCard key={p.id} project={p} staleDays={staleDays} onOpen={openProject} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" onClick={() => fetchPage(page + 1, true)} disabled={loadingMore}>
                    {loadingMore ? "Carregando..." : "Carregar mais"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ProjectFollowUpDrawer project={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
