import { formatLocation } from "@/lib/location";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Building2, MapPin, UserRound, Briefcase, MessageSquareText, Clock } from "lucide-react";
import { statusLabels, statusColors, subPhasesByStatus } from "@/pages/ProjectManagement";
import {
  daysSince,
  effectiveFollowUps,
  followUpReferenceDate,
  followUpLevel,
  followUpLevelStyles,
} from "@/lib/followUpNotes";
import type { FollowUpProject } from "./types";

interface Props {
  project: FollowUpProject;
  staleDays: number;
  onOpen: (project: FollowUpProject) => void;
  justUpdated?: boolean;
}

export function ProjectFollowUpCard({ project, staleDays, onOpen, justUpdated }: Props) {
  const notes = effectiveFollowUps(project).slice(0, 2);
  const days = daysSince(followUpReferenceDate(project)) ?? 0;
  const level = followUpLevel(days, staleDays);
  const levelStyle = followUpLevelStyles[level];
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
      className={`relative cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${colors.bg} ${justUpdated ? "border-primary ring-2 ring-primary/40" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${levelStyle.dot}`}
      />
      <CardContent className="space-y-3 p-4 pl-5">
        {justUpdated && (
          <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">Atualizado agora</Badge>
        )}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              <h3 className="truncate text-sm font-semibold">{project.company_name}</h3>
              {project.is_pilot && <Badge variant="outline" className="text-[10px]">Piloto</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {project.project_code && <span className="font-mono">{project.project_code}</span>}
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{formatLocation(project.city, project.state, project.country_code)}</span>
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
            <span className={`text-[10px] font-medium ${levelStyle.text}`}>{levelStyle.label}</span>
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
            Últimas atualizações
          </div>
          {notes.length > 0 ? (
            <ul className="space-y-2">
              {notes.map((n, i) => (
                <li key={i} className={i > 0 ? "border-t border-border/40 pt-2" : undefined}>
                  <p className={`whitespace-pre-line text-sm text-foreground ${i === 0 ? "line-clamp-3" : "line-clamp-2 opacity-80"}`}>{n.text}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {n.dateLabel ?? "—"}{n.author ? ` • ${n.author}` : ""}
                  </p>
                </li>
              ))}
            </ul>
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
