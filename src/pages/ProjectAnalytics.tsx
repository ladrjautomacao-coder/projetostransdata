import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Clock, Package, TrendingUp, Users, MapPin, CalendarDays, Layers } from "lucide-react";
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
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
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
  "hsl(28 90% 52%)",   // primary orange
  "hsl(38 92% 50%)",   // amber
  "hsl(142 72% 42%)",  // green
  "hsl(0 72% 51%)",    // red
];

const PRODUCT_COLORS = [
  "hsl(28 90% 52%)",
  "hsl(220 20% 40%)",
  "hsl(38 92% 50%)",
  "hsl(142 72% 42%)",
  "hsl(280 60% 50%)",
  "hsl(190 70% 45%)",
  "hsl(340 65% 50%)",
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

  // --- Chart data ---
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Constants.public.Enums.project_status.map((s, i) => ({
      name: statusLabels[s],
      value: counts[s] || 0,
      fill: STATUS_COLORS[i],
    }));
  }, [filteredProjects]);

  const stateData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      counts[p.state] = (counts[p.state] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([state, count]) => ({ state, count }));
  }, [filteredProjects]);

  const productData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      p.project_products?.forEach(pp => {
        const name = pp.product?.name || "Sem produto";
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, fill: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }));
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
          name: p.company_name.length > 15 ? p.company_name.substring(0, 15) + "…" : p.company_name,
          contratoDzero: differenceInDays(dzero, start),
          dzeroHandover: differenceInDays(end, dzero),
        };
      })
      .slice(0, 12);
  }, [filteredProjects]);

  // KPIs
  const totalProjects = filteredProjects.length;
  const avgFleet = filteredProjects.filter(p => p.fleet_size).reduce((acc, p) => acc + (p.fleet_size || 0), 0) / (filteredProjects.filter(p => p.fleet_size).length || 1);
  const activeProjects = filteredProjects.filter(p => p.status === "implantacao").length;
  const totalStates = new Set(filteredProjects.map(p => p.state)).size;

  const statusChartConfig: ChartConfig = {
    value: { label: "Projetos" },
  };
  const timelineConfig: ChartConfig = {
    contratos: { label: "Contratos", color: "hsl(28 90% 52%)" },
    dzero: { label: "D-Zero", color: "hsl(38 92% 50%)" },
    handover: { label: "Handover", color: "hsl(142 72% 42%)" },
  };
  const durationConfig: ChartConfig = {
    contratoDzero: { label: "Contrato → D-Zero", color: "hsl(28 90% 52%)" },
    dzeroHandover: { label: "D-Zero → Handover", color: "hsl(220 20% 40%)" },
  };
  const stateConfig: ChartConfig = { count: { label: "Projetos", color: "hsl(28 90% 52%)" } };
  const managerConfig: ChartConfig = { value: { label: "Projetos", color: "hsl(28 90% 52%)" } };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-medium animate-pulse">Carregando dados analíticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/projetos")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Visão Analítica</h1>
          <p className="text-sm text-muted-foreground">Dashboard completo dos projetos</p>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filtrar por projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Projetos</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glow-orange border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Projetos</p>
              <p className="text-2xl font-bold">{totalProjects}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Em Implantação</p>
              <p className="text-2xl font-bold">{activeProjects}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Estados</p>
              <p className="text-2xl font-bold">{totalStates}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Frota Média</p>
              <p className="text-2xl font-bold">{Math.round(avgFleet)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Status + Products */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Status dos Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[280px]">
              <PieChart>
                <Pie
                  data={statusData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.filter(d => d.value > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Produtos por Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[280px]">
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {productData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Evolução Temporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={timelineConfig} className="h-[300px]">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="gradContratos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(28 90% 52%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(28 90% 52%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDzero" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradHandover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 72% 42%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(142 72% 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="contratos" stroke="hsl(28 90% 52%)" fill="url(#gradContratos)" strokeWidth={2} />
              <Area type="monotone" dataKey="dzero" stroke="hsl(38 92% 50%)" fill="url(#gradDzero)" strokeWidth={2} />
              <Area type="monotone" dataKey="handover" stroke="hsl(142 72% 42%)" fill="url(#gradHandover)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Row 3: Duration + State */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Duração (dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={durationConfig} className="h-[300px]">
              <BarChart data={durationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="contratoDzero" stackId="a" fill="hsl(28 90% 52%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="dzeroHandover" stackId="a" fill="hsl(220 20% 40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Projetos por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={stateConfig} className="h-[300px]">
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(28 90% 52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Manager distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Projetos por Gerente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={managerConfig} className="h-[280px]">
            <BarChart data={managerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="hsl(28 90% 52%)" radius={[4, 4, 0, 0]}>
                {managerData.map((_, i) => (
                  <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Project detail cards when single project selected */}
      {selectedProject !== "all" && filteredProjects.length === 1 && (
        <Card className="border-primary/30 glow-orange">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalhes do Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const p = filteredProjects[0];
              const fmtDate = (d: string | null) => d ? format(parseISO(d), "dd/MM/yyyy") : "—";
              return (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Empresa</p>
                    <p className="font-semibold">{p.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Localização</p>
                    <p className="font-semibold">{p.city}/{p.state}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Status</p>
                    <Badge variant="outline">{statusLabels[p.status]}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Data Contrato</p>
                    <p className="font-semibold">{fmtDate(p.contract_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">D-Zero</p>
                    <p className="font-semibold">{fmtDate(p.d_zero_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Handover</p>
                    <p className="font-semibold">{fmtDate(p.handover_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Gerente</p>
                    <p className="font-semibold">{p.manager?.full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Executivo</p>
                    <p className="font-semibold">{p.executive?.full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Frota</p>
                    <p className="font-semibold">{p.fleet_size || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Piloto</p>
                    <p className="font-semibold">{p.is_pilot ? "Sim" : "Não"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Produtos</p>
                    <div className="flex flex-wrap gap-1">
                      {p.project_products?.map((pp, i) => (
                        <Badge key={i} variant="secondary">{pp.product?.name}</Badge>
                      ))}
                      {(!p.project_products || p.project_products.length === 0) && <span className="text-sm text-muted-foreground">Nenhum</span>}
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
