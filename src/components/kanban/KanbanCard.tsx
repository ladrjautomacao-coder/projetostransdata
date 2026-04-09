import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Building2, MapPin, Calendar, Users, Pencil } from "lucide-react";
import { format } from "date-fns";
import type { ProjectRow } from "@/pages/ProjectManagement";

const fmtDate = (d: string | null) => d ? format(new Date(d + "T00:00:00"), "dd/MM/yyyy") : "—";

interface Props {
  project: ProjectRow;
  index: number;
  onUpdateObservations: (projectId: string, text: string) => Promise<void>;
}

export default function KanbanCard({ project: p, index, onUpdateObservations }: Props) {
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

  return (
    <Draggable draggableId={p.id} index={index}>
      {(dragProvided, dragSnapshot) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          {...dragProvided.dragHandleProps}
        >
          <Card
            className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-border/40 bg-card ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""} ${p.is_pilot ? "border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10" : p.complementary_sale ? "border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10" : ""}`}
            onClick={() => !dragSnapshot.isDragging && !open && navigate(`/projetos/${p.id}`, { state: { from: "/projetos/gestao" } })}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm font-semibold leading-tight flex-1">{p.company_name}</span>
                {p.is_pilot && (
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] h-4 px-1.5 shrink-0">Piloto</Badge>
                )}
                {p.complementary_sale && (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[10px] h-4 px-1.5 shrink-0">
                    V. Compl.{p.complementary_fleet > 0 ? ` (${p.complementary_fleet})` : ""}
                  </Badge>
                )}
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
              {p.project_solutions?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {p.project_solutions.map((ps, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5">{ps.solution?.name}</Badge>
                  ))}
                </div>
              )}
              {p.project_integrations?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {p.project_integrations.map((pi, i) => (
                    <Badge key={i} className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200 text-[10px] h-4 px-1.5">{pi.integration?.name}</Badge>
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
