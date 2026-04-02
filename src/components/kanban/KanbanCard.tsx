import { useNavigate } from "react-router-dom";
import { Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import type { ProjectRow } from "@/pages/ProjectManagement";

const fmtDate = (d: string | null) => d ? format(new Date(d + "T00:00:00"), "dd/MM/yyyy") : "—";

interface Props {
  project: ProjectRow;
  index: number;
}

export default function KanbanCard({ project: p, index }: Props) {
  const navigate = useNavigate();

  return (
    <Draggable draggableId={p.id} index={index}>
      {(dragProvided, dragSnapshot) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          {...dragProvided.dragHandleProps}
        >
          <Card
            className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-border/40 bg-card ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""} ${p.is_pilot ? "border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10" : ""}`}
            onClick={() => !dragSnapshot.isDragging && navigate(`/projetos/${p.id}`)}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm font-semibold leading-tight flex-1">{p.company_name}</span>
                {p.is_pilot && (
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] h-4 px-1.5 shrink-0">Piloto</Badge>
                )}
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
        </div>
      )}
    </Draggable>
  );
}
