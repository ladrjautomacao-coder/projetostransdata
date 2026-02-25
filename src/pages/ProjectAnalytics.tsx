import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Clock, Package, TrendingUp, Users, MapPin, CalendarDays, Layers, Zap, Signal } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell,
  AreaChart, Area,
  RadialBarChart, RadialBar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, differenceInDays, parseISO } from "date-fns";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const statusLabels: Record<ProjectStatus, string> = {
  planejamento: "Planejamento",
  implantacao: "Implantação",
  encerrado: "Encerrado",
  suspenso: "Suspenso",
};

const STATUS_COLORS = [
  "hsl(28 90% 52%)",
  "hsl(38 92% 50%)",
  "hsl(142 72% 42%)",
  "hsl(0 62% 50%)",
];

const PRODUCT_COLORS = [
  "hsl(28 90% 52%)",
  "hsl(190 80% 50%)",
  "hsl(280 65% 55%)",
  "hsl(142 72% 42%)",
  "hsl(38 92% 50%)",
  "hsl(340 65% 50%)",
  "hsl(220 70% 55%)",
  "hsl(60 70% 45%)",
];

interface ProjectRow {
  id: string;
  company_name: string;
  city: string;
  state: string;
  contract_date: string;
  d_zero_date: string | null;
  handover_date: string | null;
  status: ProjectStatus;
  fleet_size: number | null;
  contractual_deadline_days: number | null;
  implementation_deadline_days: number | null;
  is_pilot: boolean;
  executive: { full_name: string } | null;
  manager: { full_name: string } | null;
  project_products: { product: { name: string } | null }[];
  project_solutions: { solution: { name: string } | null }[];
}

function GlowCard({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={`relative rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden ${glow ? "glow-orange" : ""} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent = "primary" }: { icon: any; label: string; value: string | number; accent?: string }) {
  const accentMap: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 text-primary border-primary/20",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/20",
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-500 border-cyan-500/20",
  };
  const colors = accentMap[accent] || accentMap.primary;

  return (
    <GlowCard glow={accent === "primary"}>
      <div className="p-5 flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${colors} border`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">{label}</p>
          <p className="text-3xl font-bold tracking-tight mt-0.5" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{value}</p>
        </div>
      </div>
    </GlowCard>
  );
}

export default function ProjectAnalytics() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("projects")
        .select(`
          id, company_name, city, state, contract_date, d_zero_date, handover_date,
          status, fleet_size, contractual_deadline_days, implementation_deadline_days, is_pilot,
          executive:team_members!projects_executive_id_fkey(full_name),
          manager:team_members!projects_manager_id_fkey(full_name),
          project_products(product:products(name)),
          project_solutions(solution:solutions(name))
        `)
        .order("company_name");
      setProjects((data as unknown as ProjectRow[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const filteredProjects = useMemo(() => {
    if (selectedProject === "all") return projects;
    return projects.filter(p => p.id === selectedProject);
  }, [projects, selectedProject]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Constants.public.Enums.project_status.map((s, i) => ({
      name: statusLabels[s],
      value: counts[s] || 0,
      fill: STATUS_COLORS[i],
    }));
  }, [filteredProjects]);

  const stateData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => { counts[p.state] = (counts[p.state] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([state, count]) => ({ state, count }));
  }, [filteredProjects]);

  const solutionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      p.project_solutions?.forEach(ps => {
        const name = ps.solution?.name || "Sem solução";
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({
      name, value, fill: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
    }));
  }, [filteredProjects]);

  const timelineData = useMemo(() => {
    const months: Record<string, { month: string; contratos: number; dzero: number; handover: number }> = {};
    filteredProjects.forEach(p => {
      const cm = format(parseISO(p.contract_date), "yyyy-MM");
      if (!months[cm]) months[cm] = { month: cm, contratos: 0, dzero: 0, handover: 0 };
      months[cm].contratos++;
      if (p.d_zero_date) {
        const dm = format(parseISO(p.d_zero_date), "yyyy-MM");
        if (!months[dm]) months[dm] = { month: dm, contratos: 0, dzero: 0, handover: 0 };
        months[dm].dzero++;
      }
      if (p.handover_date) {
        const hm = format(parseISO(p.handover_date), "yyyy-MM");
        if (!months[hm]) months[hm] = { month: hm, contratos: 0, dzero: 0, handover: 0 };
        months[hm].handover++;
      }
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredProjects]);

  const managerData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      const name = p.manager?.full_name || "Sem gerente";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredProjects]);

  const durationData = useMemo(() => {
    return filteredProjects
      .filter(p => p.d_zero_date)
      .map(p => {
        const start = parseISO(p.contract_date);
        const dzero = parseISO(p.d_zero_date!);
        const end = p.handover_date ? parseISO(p.handover_date) : new Date();
        return {
          name: p.company_name.length > 18 ? p.company_name.substring(0, 18) + "…" : p.company_name,
          contratoDzero: differenceInDays(dzero, start),
          dzeroHandover: differenceInDays(end, dzero),
        };
      })
      .slice(0, 10);
  }, [filteredProjects]);

  const radialStatusData = useMemo(() => {
    const total = filteredProjects.length || 1;
    return statusData.filter(d => d.value > 0).map(d => ({
      ...d,
      pct: Math.round((d.value / total) * 100),
    }));
  }, [statusData, filteredProjects]);

  const totalProjects = filteredProjects.length;
  const avgFleet = filteredProjects.filter(p => p.fleet_size).reduce((a, p) => a + (p.fleet_size || 0), 0) / (filteredProjects.filter(p => p.fleet_size).length || 1);
  const activeProjects = filteredProjects.filter(p => p.status === "implantacao").length;
  const totalStates = new Set(filteredProjects.map(p => p.state)).size;

  const timelineConfig: ChartConfig = {
    contratos: { label: "Contratos", color: "hsl(28 90% 52%)" },
    dzero: { label: "D-Zero", color: "hsl(190 80% 50%)" },
    handover: { label: "Handover", color: "hsl(142 72% 42%)" },
  };
  const durationConfig: ChartConfig = {
    contratoDzero: { label: "Contrato → D-Zero", color: "hsl(28 90% 52%)" },
    dzeroHandover: { label: "D-Zero → Handover", color: "hsl(190 80% 50%)" },
  };
  const genericConfig: ChartConfig = { value: { label: "Projetos" }, count: { label: "Projetos" } };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <Zap className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium tracking-wide uppercase text-xs">Processando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/projetos")} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Visão Analítica</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-primary uppercase tracking-widest font-medium">
              <Signal className="h-3 w-3 animate-pulse" />
              Live
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Painel de inteligência dos projetos</p>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[260px] bg-card/80 backdrop-blur-sm border-border/50">
            <SelectValue placeholder="Filtrar projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Projetos</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Layers} label="Total Projetos" value={totalProjects} accent="primary" />
        <KpiCard icon={Activity} label="Em Implantação" value={activeProjects} accent="amber" />
        <KpiCard icon={MapPin} label="Estados" value={totalStates} accent="emerald" />
        <KpiCard icon={TrendingUp} label="Frota Média" value={Math.round(avgFleet)} accent="cyan" />
      </div>

      {/* Row 1: Status Radial + Products Donut */}
      <div className="grid lg:grid-cols-2 gap-6">
        <GlowCard>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status dos Projetos</h3>
            </div>
            <div className="flex items-center gap-6">
              <ChartContainer config={genericConfig} className="h-[220px] flex-1">
                <PieChart>
                  <Pie
                    data={statusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {statusData.filter(d => d.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-col gap-2.5 min-w-[140px]">
                {statusData.filter(d => d.value > 0).map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: d.fill }} />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground leading-none">{d.name}</p>
                      <p className="text-sm font-bold mt-0.5">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Soluções</h3>
            </div>
            <div className="flex items-center gap-6">
              <ChartContainer config={genericConfig} className="h-[220px] flex-1">
                <PieChart>
                  <Pie
                    data={solutionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {solutionData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-col gap-2 min-w-[120px] max-h-[220px] overflow-auto">
                {solutionData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-xs text-muted-foreground truncate">{d.name}</span>
                    <span className="text-xs font-bold ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Row 2: Timeline */}
      <GlowCard glow>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Evolução Temporal</h3>
            <div className="flex gap-4 ml-auto">
              {Object.entries(timelineConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ChartContainer config={timelineConfig} className="h-[280px]">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="gContratos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(28 90% 52%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(28 90% 52%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDzero" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(190 80% 50%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(190 80% 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gHandover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 72% 42%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(142 72% 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="contratos" stroke="hsl(28 90% 52%)" fill="url(#gContratos)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(28 90% 52%)", strokeWidth: 0 }} />
              <Area type="monotone" dataKey="dzero" stroke="hsl(190 80% 50%)" fill="url(#gDzero)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(190 80% 50%)", strokeWidth: 0 }} />
              <Area type="monotone" dataKey="handover" stroke="hsl(142 72% 42%)" fill="url(#gHandover)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(142 72% 42%)", strokeWidth: 0 }} />
            </AreaChart>
          </ChartContainer>
        </div>
      </GlowCard>

      {/* Row 3: Duration + State */}
      <div className="grid lg:grid-cols-2 gap-6">
        <GlowCard>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Duração (dias)</h3>
            </div>
            <ChartContainer config={durationConfig} className="h-[280px]">
              <BarChart data={durationData} layout="vertical" barGap={0} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="contratoDzero" stackId="a" fill="hsl(28 90% 52%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="dzeroHandover" stackId="a" fill="hsl(190 80% 50%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </GlowCard>

        <GlowCard>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Projetos por Estado</h3>
            </div>
            <ChartContainer config={genericConfig} className="h-[280px]">
              <BarChart data={stateData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                <XAxis dataKey="state" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(28 90% 52%)" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(28 90% 52%)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </GlowCard>
      </div>

      {/* Row 4: Manager */}
      <GlowCard>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Projetos por Gerente</h3>
          </div>
          <ChartContainer config={genericConfig} className="h-[250px]">
            <BarChart data={managerData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {managerData.map((_, i) => (
                  <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </GlowCard>

      {/* Detail card for single project */}
      {selectedProject !== "all" && filteredProjects.length === 1 && (() => {
        const p = filteredProjects[0];
        const fmtDate = (d: string | null) => d ? format(parseISO(d), "dd/MM/yyyy") : "—";
        return (
          <GlowCard glow>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ficha do Projeto</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                {[
                  { l: "Empresa", v: p.company_name },
                  { l: "Localização", v: `${p.city}/${p.state}` },
                  { l: "Status", v: statusLabels[p.status] },
                  { l: "Contrato", v: fmtDate(p.contract_date) },
                  { l: "D-Zero", v: fmtDate(p.d_zero_date) },
                  { l: "Handover", v: fmtDate(p.handover_date) },
                  { l: "Gerente", v: p.manager?.full_name || "—" },
                  { l: "Executivo", v: p.executive?.full_name || "—" },
                  { l: "Frota", v: String(p.fleet_size || "—") },
                  { l: "Piloto", v: p.is_pilot ? "Sim" : "Não" },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">{item.l}</p>
                    <p className="text-sm font-semibold mt-0.5">{item.v}</p>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mb-1">Soluções</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.project_solutions?.map((ps, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{ps.solution?.name}</Badge>
                    ))}
                    {(!p.project_solutions || p.project_solutions.length === 0) && <span className="text-xs text-muted-foreground">Nenhuma</span>}
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>
        );
      })()}
    </div>
  );
}
