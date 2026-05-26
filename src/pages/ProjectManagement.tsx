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
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import KanbanFilters from "@/components/kanban/KanbanFilters";
import KanbanColumn from "@/components/kanban/KanbanColumn";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

export const statusLabels: Record<ProjectStatus, string> = {
  comercial: "Comercial",
  planejamento: "Planejamento",
  implantacao: "Implantação",
  encerrado: "Implementado",
  suspenso: "Outros",
};

export const statusColors: Record<ProjectStatus, { bg: string; border: string; text: string; accent: string }> = {
  comercial: { bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-600", accent: "bg-blue-500" },
  planejamento: { bg: "bg-primary/5", border: "border-primary/20", text: "text-primary", accent: "bg-primary" },
  implantacao: { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-600", accent: "bg-amber-500" },
  encerrado: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-600", accent: "bg-emerald-500" },
  suspenso: { bg: "bg-red-500/5", border: "border-red-500/20", text: "text-red-600", accent: "bg-red-500" },
};

export const statusDescriptions: Partial<Record<ProjectStatus, string>> = {
  comercial: "Projeto cadastrado, em análise dos pré-requisitos para se tornar um Projeto.",
};

export interface SubPhaseConfig {
  id: string;
  label: string;
  description?: string;
}

export const subPhasesByStatus: Partial<Record<ProjectStatus, SubPhaseConfig[]>> = {
  comercial: [
    { id: "contrato_assinado", label: "Contrato Transdata assinado", description: "Contrato firmado entre as partes para início do projeto." },
    { id: "cobranca_dzero", label: "Cobrança D-zero emitida", description: "Emissão da cobrança referente ao D-zero do projeto." },
    { id: "pagamento_dzero", label: "Pagamento D-zero efetuado", description: "Confirmação do pagamento do D-zero pelo cliente." },
    { id: "sem_pendencias", label: "Cliente sem pendências financeiras", description: "Verificação de que o cliente não possui pendências financeiras." },
  ],
  planejamento: [
    { id: "reuniao_handover", label: "Reunião de Handover", description: "Marca o início do projeto e a transição das responsabilidades do time comercial para o time de projetos." },
    { id: "reuniao_kickoff", label: "Reunião de Kick-off", description: "Primeiro contato da equipe de projetos com o cliente, incluindo a apresentação do Gerente de Projetos responsável." },
    { id: "reuniao_proj_executivo", label: "Reunião Projeto Executivo", description: "Etapa em que são apresentadas as fases do projeto e coletadas as informações necessárias para a elaboração do Projeto Executivo." },
    { id: "levantamento_materiais", label: "Levantamento de Materiais", description: "Fase de coleta dos dados do veículo para definição dos materiais necessários." },
    { id: "aquisicao_materiais", label: "Aquisição de Materiais", description: "Envio da lista de materiais ao cliente para que a compra seja realizada junto aos fornecedores homologados." },
    { id: "cronograma_visita", label: "Cronograma de Visita Técnica", description: "Organização das visitas entre o cliente, o Gerente de Projetos e a equipe responsável pela implantação." },
  ],
  suspenso: [
    { id: "suspenso", label: "Suspenso", description: "Projeto temporariamente suspenso." },
    { id: "cancelado", label: "Cancelado", description: "Projeto cancelado." },
  ],
};

export interface ProjectRow {
  id: string;
  company_name: string;
  city: string;
  state: string;
  contract_date: string;
  d_zero_date: string | null;
  handover_date: string | null;
  status: ProjectStatus;
  sub_phase: string | null;
  is_pilot: boolean;
  complementary_sale: boolean;
  complementary_fleet: number;
  implemented_fleet: number;
  observations: string | null;
  executive: { full_name: string } | null;
  manager: { full_name: string } | null;
  project_solutions: { solution: { name: string } | null }[];
  project_integrations: { integration: { name: string } | null }[];
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
      .select("id, company_name, city, state, contract_date, d_zero_date, handover_date, status, sub_phase, is_pilot, complementary_sale, complementary_fleet, implemented_fleet, observations, executive:team_members!projects_executive_id_fkey(full_name), manager:team_members!projects_manager_id_fkey(full_name), project_solutions(solution:solutions(name)), project_integrations(integration:integrations(name))")
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
      comercial: [], planejamento: [], implantacao: [], encerrado: [], suspenso: [],
    };
    filtered.forEach(p => map[p.status]?.push(p));
    return map;
  }, [filtered]);

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    // Parse composite droppable ID: "status::sub_phase" or just "status"
    const parts = destination.droppableId.split("::");
    const newStatus = parts[0] as ProjectStatus;
    const newSubPhase = parts[1] || null;

    const project = projects.find(p => p.id === draggableId);
    if (!project) return;
    if (project.status === newStatus && project.sub_phase === newSubPhase) return;

    // Optimistic update
    setProjects(prev => prev.map(p => p.id === draggableId ? { ...p, status: newStatus, sub_phase: newSubPhase } : p));

    const updateData: Record<string, unknown> = { status: newStatus, sub_phase: newSubPhase };
    const { error } = await supabase.from("projects").update(updateData).eq("id", draggableId);
    if (error) {
      toast.error("Erro ao atualizar status do projeto");
      setProjects(prev => prev.map(p => p.id === draggableId ? { ...p, status: project.status, sub_phase: project.sub_phase } : p));
    } else {
      const label = newSubPhase
        ? subPhasesByStatus[newStatus]?.find(sp => sp.id === newSubPhase)?.label || statusLabels[newStatus]
        : statusLabels[newStatus];
      toast.success(`Projeto movido para ${label}`);
    }
  }, [projects]);

  const onUpdateObservations = useCallback(async (projectId: string, newText: string) => {
    const project = projects.find(p => p.id === projectId);
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
    const entry = `[${timestamp}] ${newText}`;
    const updated = project?.observations ? `${entry}\n${project.observations}` : entry;

    const { error } = await supabase.from("projects").update({ observations: updated }).eq("id", projectId);
    if (error) {
      toast.error("Erro ao salvar acompanhamento");
    } else {
      toast.success("Acompanhamento registrado");
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, observations: updated } : p));
    }
  }, [projects]);

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
        <KanbanFilters
          filters={filters}
          setFilter={setFilter}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          managers={managers}
          cities={cities}
          columns={columns}
        />

        {/* Kanban Board */}
        <div className="flex-1 flex gap-3 min-h-0 overflow-x-auto">
          <DragDropContext onDragEnd={onDragEnd}>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              columns.map(status => (
                <KanbanColumn
                  key={status}
                  status={status}
                  items={grouped[status]}
                  subPhases={subPhasesByStatus[status] || null}
                  onUpdateObservations={onUpdateObservations}
                />
              ))
            )}
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}
