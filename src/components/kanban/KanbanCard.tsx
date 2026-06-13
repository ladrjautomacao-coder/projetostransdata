import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, MapPin, Calendar, Users, Pencil, Clock, Lock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { ProjectRow } from "@/pages/ProjectManagement";

const fmtDate = (d: string | null) => d ? format(new Date(d + "T00:00:00"), "dd/MM/yyyy") : "—";

type SLALevel = "green" | "yellow" | "orange" | "red";
function getSLA(updatedAt: string): { level: SLALevel; days: number } {
  const days = Math.max(0, differenceInDays(new Date(), new Date(updatedAt)));
  if (days <= 7) return { level: "green", days };
  if (days <= 15) return { level: "yellow", days };
  if (days <= 30) return { level: "orange", days };
  return { level: "red", days };
}
const SLA_BAR: Record<SLALevel, string> = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};
const SLA_LABEL: Record<SLALevel, string> = {
  green: "Em dia",
  yellow: "Atenção",
  orange: "Atrasado",
  red: "Crítico",
};

interface Props {
  project: ProjectRow;
  index: number;
  onUpdateObservations: (projectId: string, text: string) => Promise<void>;
  canEdit?: boolean;
}

export default function KanbanCard({ project: p, index, onUpdateObservations, canEdit = true }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    await onUpdateObservations(p.id, note.trim());
    setSaving(false);
    setNote("");
    setOpen(false);
  };

  const returnedFromImplemented = p.reached_implemented && p.status !== "encerrado";
  const returnedDateLabel = returnedFromImplemented && p.reached_implemented_at
    ? format(new Date(p.reached_implemented_at), "dd/MM/yyyy")
    : null;

  // SLA: não aplicar em "Implementado" (encerrado) nem em "Outros" (suspenso)
  const slaEligible = p.status !== "encerrado" && p.status !== "suspenso";
  const sla = slaEligible && p.updated_at ? getSLA(p.updated_at) : null;

  const borderClass = returnedFromImplemented
    ? "border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10"
    : p.is_pilot
      ? "border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10"
      : p.complementary_sale
        ? "border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10"
        : "";

  return (
    <Draggable draggableId={p.id} index={index}>
      {(dragProvided, dragSnapshot) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          {...dragProvided.dragHandleProps}
        >
          <Card
            className={`relative cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-border/40 bg-card overflow-hidden ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""} ${borderClass}`}
            onClick={() => !dragSnapshot.isDragging && !open && navigate(`/projetos/${p.id}`, { state: { from: "/projetos/gestao" } })}
          >
            {sla && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-0 left-0 right-0 h-3 z-10 cursor-help"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={`h-1.5 ${SLA_BAR[sla.level]} ${sla.level === "red" ? "animate-pulse" : ""}`} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {SLA_LABEL[sla.level]} — parado há {sla.days} dia{sla.days !== 1 ? "s" : ""} nesta etapa
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {sla && (
              <span
                className={`absolute top-2 left-2 z-10 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm ${SLA_BAR[sla.level]} ${sla.level === "red" ? "animate-pulse" : ""}`}
                onClick={(e) => e.stopPropagation()}
                title={`${SLA_LABEL[sla.level]} — parado há ${sla.days} dia${sla.days !== 1 ? "s" : ""}`}
              >
                <Clock className="h-2.5 w-2.5" />
                {sla.days}d
              </span>
            )}
            {returnedFromImplemented && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="absolute bottom-3 right-3 z-20 flex h-4 w-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white dark:border-gray-900" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Projeto retornou de Implementado{returnedDateLabel ? ` em ${returnedDateLabel}` : ""}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className={`h-3.5 w-3.5 text-primary mt-0.5 shrink-0 ${sla ? "ml-10" : ""}`} />
                <span className="text-sm font-semibold leading-tight flex-1">{p.company_name}</span>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  {p.is_pilot && (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] h-4 px-1.5">Piloto</Badge>
                  )}
                  {p.complementary_sale && (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[10px] h-4 px-1.5">
                      V. Compl.{p.complementary_fleet > 0 ? ` (${p.complementary_fleet})` : ""}
                    </Badge>
                  )}
                  {p.project_integrations?.map((pi, i) => (
                    <Badge key={i} className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200 text-[10px] h-4 px-1.5">{pi.integration?.name}</Badge>
                  ))}
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="p-0.5 rounded hover:bg-muted shrink-0"
                      onClick={e => { e.stopPropagation(); }}
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-72"
                    side="right"
                    align="start"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Acompanhamento do Projeto</p>
                      <Textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Registre o andamento atual..."
                        maxLength={500}
                        rows={3}
                        className="text-sm"
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={handleSave} disabled={saving || !note.trim()}>
                          {saving ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
              {p.complementary_sale && p.implemented_fleet > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {p.implemented_fleet} impl. / {(p.complementary_fleet || 0) + (p as any).fleet_size || p.complementary_fleet || 0} total
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
        </div>
      )}
    </Draggable>
  );
}
