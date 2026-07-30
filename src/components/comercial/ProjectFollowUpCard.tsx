import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Building2, MapPin, UserRound, Briefcase, MessageSquareText, Clock } from "lucide-react";
import { statusLabels, statusColors, subPhasesByStatus } from "@/pages/ProjectManagement";
import { latestFollowUpNote, daysSince } from "@/lib/followUpNotes";
import type { FollowUpProject } from "./types";

interface Props {
  project: FollowUpProject;
  staleDays: number;
  onOpen: (project: FollowUpProject) => void;
}

export function ProjectFollowUpCard({ project, staleDays, onOpen }: Props) {
  const note = latestFollowUpNote(project.observations);
  const referenceDate = note?.date ? note.date.toISOString() : project.updated_at;
  const days = daysSince(referenceDate) ?? 0;
  const isStale = days > staleDays;
  const colors = statusColors[project.status];
  const subPhaseLabel = project.sub_phase
    ? subPhasesByStatus[project.status]?.find(sp => sp.id === project.sub_phase)?.label ?? null
    : null;

  const total = project.fleet_size ?? 0;
  const done = project.implemented_fleet ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(project); } }}
      className={`cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${colors.bg}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              <h3 className="truncate text-sm font-semibold">{project.company_name}</h3>
              {project.is_pilot && <Badge variant="outline" className="text-[10px]">Piloto</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {project.project_code && <span className="font-mono">{project.project_code}</span>}
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.city}/{project.state}</span>
              <span className="flex items-center gap-1"><UserRound className="h-3 w-3" />{project.manager?.full_name ?? "Sem gerente"}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{project.executive?.full_name ?? "Sem executivo"}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={`${colors.text} ${colors.border}`}>
              {statusLabels[project.status]}
            </Badge>
            {subPhaseLabel && (
              <span className="text-[10px] text-muted-foreground">{subPhaseLabel}</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Frota implantada</span>
            <span className="font-medium text-foreground">{done} / {total || "—"}{total > 0 ? ` (${pct}%)` : ""}</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        <div className="rounded-lg border border-border/50 bg-background/70 p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <MessageSquareText className="h-3.5 w-3.5 text-primary" />
            Última atualização
          </div>
          {note ? (
            <>
              <p className="whitespace-pre-line text-sm text-foreground line-clamp-3">{note.text}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {note.dateLabel ?? "—"}{note.author ? ` • ${note.author}` : ""}
              </p>
            </>
          ) : (
            <p className="text-sm italic text-muted-foreground">Nenhum acompanhamento registrado pelo gerente.</p>
          )}
        </div>

        {isStale && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Sem atualização há {days} dias
          </div>
        )}
      </CardContent>
    </Card>
  );
}
