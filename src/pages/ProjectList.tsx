import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type BrazilianState = Database["public"]["Enums"]["brazilian_state"];

const statusLabels: Record<ProjectStatus, string> = {
  planejamento: "Planejamento",
  implantacao: "Implantação",
  encerrado: "Encerrado",
  suspenso: "Suspenso",
};

const statusColors: Record<ProjectStatus, string> = {
  planejamento: "bg-primary/15 text-primary border-primary/30",
  implantacao: "bg-amber-100 text-amber-800 border-amber-300",
  encerrado: "bg-emerald-100 text-emerald-800 border-emerald-300",
  suspenso: "bg-red-100 text-red-800 border-red-300",
};

interface ProjectRow {
  id: string;
  company_name: string;
  city: string;
  state: BrazilianState;
  contract_date: string;
  d_zero_date: string | null;
  handover_date: string | null;
  status: ProjectStatus;
  executive: { full_name: string } | null;
  manager: { full_name: string } | null;
  project_products: { product: { name: string } | null }[];
}

type SortKey = "company_name" | "city" | "contract_date" | "d_zero_date" | "handover_date" | "status";

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterManager, setFilterManager] = useState("");
  const [filterExecutive, setFilterExecutive] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("company_name");
  const [sortAsc, setSortAsc] = useState(true);

  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([]);
  const [executives, setExecutives] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    supabase.from("team_members").select("id, full_name").eq("role", "gerente_projetos").eq("active", true).then(({ data }) => setManagers(data || []));
    supabase.from("team_members").select("id, full_name").eq("role", "executivo_vendas").eq("active", true).then(({ data }) => setExecutives(data || []));
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("projects")
        .select("id, company_name, city, state, contract_date, d_zero_date, handover_date, status, executive:team_members!projects_executive_id_fkey(full_name), manager:team_members!projects_manager_id_fkey(full_name), project_products(product:products(name))")
        .order("company_name");
      setProjects((data as unknown as ProjectRow[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = projects;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.company_name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.executive?.full_name?.toLowerCase().includes(q) ||
        p.manager?.full_name?.toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter(p => p.status === filterStatus);
    if (filterState) list = list.filter(p => p.state === filterState);
    if (filterManager) list = list.filter(p => p.manager?.full_name === filterManager);
    if (filterExecutive) list = list.filter(p => p.executive?.full_name === filterExecutive);

    list = [...list].sort((a, b) => {
      const av = (a as any)[sortKey] || "";
      const bv = (b as any)[sortKey] || "";
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [projects, search, filterStatus, filterState, filterManager, filterExecutive, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">{label} <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
    </TableHead>
  );

  const fmtDate = (d: string | null) => d ? format(new Date(d + "T00:00:00"), "dd/MM/yyyy") : "—";

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate("/projetos")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      <h1 className="text-2xl font-bold mb-6">Projetos Existentes</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Constants.public.Enums.project_status.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterState} onValueChange={v => setFilterState(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Constants.public.Enums.brazilian_state.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterManager} onValueChange={v => setFilterManager(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Gerente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Gerentes</SelectItem>
            {managers.map(m => <SelectItem key={m.id} value={m.full_name}>{m.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterExecutive} onValueChange={v => setFilterExecutive(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Executivo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Executivos</SelectItem>
            {executives.map(e => <SelectItem key={e.id} value={e.full_name}>{e.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhum projeto encontrado.</p>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Empresa" field="company_name" />
                <TableHead className="whitespace-nowrap">Cidade/Estado</TableHead>
                <TableHead className="whitespace-nowrap">Gerente</TableHead>
                <TableHead className="whitespace-nowrap">Executivo</TableHead>
                <SortHeader label="D-zero" field="d_zero_date" />
                <SortHeader label="Handover" field="handover_date" />
                <SortHeader label="Status" field="status" />
                <TableHead className="whitespace-nowrap">Produtos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/projetos/${p.id}`)}>
                  <TableCell className="font-medium">{p.company_name}</TableCell>
                  <TableCell>{p.city}/{p.state}</TableCell>
                  <TableCell>{p.manager?.full_name || "—"}</TableCell>
                  <TableCell>{p.executive?.full_name || "—"}</TableCell>
                  <TableCell>{fmtDate(p.d_zero_date)}</TableCell>
                  <TableCell>{fmtDate(p.handover_date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.project_products?.map((pp, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{pp.product?.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
