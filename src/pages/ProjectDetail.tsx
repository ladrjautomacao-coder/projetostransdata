import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, Edit2, Save, X, CalendarIcon, Upload, FileText, Trash2 } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type BrazilianState = Database["public"]["Enums"]["brazilian_state"];

const statusLabels: Record<ProjectStatus, string> = {
  planejamento: "Planejamento", implantacao: "Implantação", encerrado: "Encerrado", suspenso: "Suspenso",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState<BrazilianState>("SP");
  const [contractDate, setContractDate] = useState<Date>();
  const [dZeroDate, setDZeroDate] = useState<Date>();
  const [handoverDate, setHandoverDate] = useState<Date>();
  const [executiveId, setExecutiveId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planejamento");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const [executives, setExecutives] = useState<{ id: string; full_name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);

  const loadProject = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("projects")
      .select("*, executive:team_members!projects_executive_id_fkey(id,full_name), manager:team_members!projects_manager_id_fkey(id,full_name), project_products(product_id, product:products(id,name))")
      .eq("id", id).single();
    if (data) {
      setProject(data);
      setCompanyName(data.company_name);
      setCity(data.city);
      setState(data.state);
      setContractDate(new Date(data.contract_date + "T00:00:00"));
      setDZeroDate(data.d_zero_date ? new Date(data.d_zero_date + "T00:00:00") : undefined);
      setHandoverDate(data.handover_date ? new Date(data.handover_date + "T00:00:00") : undefined);
      setExecutiveId(data.executive?.id || "");
      setManagerId(data.manager?.id || "");
      setStatus(data.status);
      setSelectedProducts(data.project_products?.map((pp: any) => pp.product_id) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProject();
    if (id) {
      supabase.from("project_history").select("*").eq("project_id", id).order("created_at", { ascending: false }).then(({ data }) => setHistory(data || []));
      supabase.from("project_attachments").select("*").eq("project_id", id).order("created_at", { ascending: false }).then(({ data }) => setAttachments(data || []));
    }
    supabase.from("team_members").select("id, full_name").eq("role", "executivo_vendas").eq("active", true).then(({ data }) => setExecutives(data || []));
    supabase.from("team_members").select("id, full_name").eq("role", "gerente_projetos").eq("active", true).then(({ data }) => setManagers(data || []));
    supabase.from("products").select("id, name").eq("active", true).then(({ data }) => setAllProducts(data || []));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const oldValues = { company_name: project.company_name, city: project.city, state: project.state, status: project.status };
      const newValues = { company_name: companyName, city, state, status };

      const { error } = await supabase.from("projects").update({
        company_name: companyName, city, state,
        contract_date: contractDate ? format(contractDate, "yyyy-MM-dd") : project.contract_date,
        d_zero_date: dZeroDate ? format(dZeroDate, "yyyy-MM-dd") : null,
        handover_date: handoverDate ? format(handoverDate, "yyyy-MM-dd") : null,
        executive_id: executiveId || null, manager_id: managerId || null, status,
      }).eq("id", id);
      if (error) throw error;

      // Update products
      await supabase.from("project_products").delete().eq("project_id", id);
      if (selectedProducts.length > 0) {
        await supabase.from("project_products").insert(selectedProducts.map(pid => ({ project_id: id, product_id: pid })));
      }

      await supabase.from("project_history").insert({ project_id: id, change_type: "updated", changed_by: user?.id || null, old_values: oldValues, new_values: newValues });
      toast({ title: "Projeto atualizado!" });
      setEditing(false);
      loadProject();
      supabase.from("project_history").select("*").eq("project_id", id).order("created_at", { ascending: false }).then(({ data }) => setHistory(data || []));
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const path = `${id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("project-attachments").upload(path, file);
    if (upErr) { toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" }); return; }
    await supabase.from("project_attachments").insert({ project_id: id, file_name: file.name, file_path: path, file_size: file.size, content_type: file.type, uploaded_by: user?.id || null });
    toast({ title: "Arquivo anexado!" });
    supabase.from("project_attachments").select("*").eq("project_id", id).order("created_at", { ascending: false }).then(({ data }) => setAttachments(data || []));
  };

  const handleDeleteAttachment = async (att: any) => {
    await supabase.storage.from("project-attachments").remove([att.file_path]);
    await supabase.from("project_attachments").delete().eq("id", att.id);
    setAttachments(prev => prev.filter(a => a.id !== att.id));
    toast({ title: "Anexo removido" });
  };

  const fmtDate = (d: string | null) => d ? format(new Date(d + "T00:00:00"), "dd/MM/yyyy") : "—";

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!project) return <p className="text-center py-12 text-muted-foreground">Projeto não encontrado.</p>;

  const DateField = ({ label, date, onSelect }: { label: string; date?: Date; onSelect: (d?: Date) => void }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("w-full justify-start", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-3 w-3" /> {date ? format(date, "dd/MM/yyyy") : "—"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );

  // Timeline data
  const timeline = [
    { label: "Contratação", date: project.contract_date, done: true },
    { label: "D-zero", date: project.d_zero_date, done: !!project.d_zero_date },
    { label: "Handover", date: project.handover_date, done: !!project.handover_date },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/projetos/lista")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{project.company_name}</h1>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="mr-1 h-4 w-4" /> Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}><Save className="mr-1 h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setEditing(true)}><Edit2 className="mr-1 h-4 w-4" /> Editar</Button>
        )}
      </div>

      {/* Timeline */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">Linha do Tempo</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
            {timeline.map((t, i) => (
              <div key={i} className="relative flex flex-col items-center z-10">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", t.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {i + 1}
                </div>
                <span className="text-xs font-medium mt-2">{t.label}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(t.date)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Dados Gerais</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Empresa</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">Cidade</Label><Input value={city} onChange={e => setCity(e.target.value)} /></div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <Select value={state} onValueChange={v => setState(v as BrazilianState)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Constants.public.Enums.brazilian_state.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <DateField label="Contratação" date={contractDate} onSelect={d => d && setContractDate(d)} />
                <DateField label="D-zero" date={dZeroDate} onSelect={setDZeroDate} />
                <DateField label="Handover" date={handoverDate} onSelect={setHandoverDate} />
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={status} onValueChange={v => setStatus(v as ProjectStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Constants.public.Enums.project_status.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div><span className="text-xs text-muted-foreground">Empresa</span><p className="font-medium">{project.company_name}</p></div>
                <div><span className="text-xs text-muted-foreground">Localização</span><p>{project.city} / {project.state}</p></div>
                <div><span className="text-xs text-muted-foreground">Contratação</span><p>{fmtDate(project.contract_date)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-xs text-muted-foreground">D-zero</span><p>{fmtDate(project.d_zero_date)}</p></div>
                  <div><span className="text-xs text-muted-foreground">Handover</span><p>{fmtDate(project.handover_date)}</p></div>
                </div>
                <div><span className="text-xs text-muted-foreground">Status</span><p><Badge variant="outline">{statusLabels[project.status as ProjectStatus]}</Badge></p></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Equipe & Produtos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Executivo de Vendas</Label>
                  <Select value={executiveId} onValueChange={setExecutiveId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{executives.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Gerente de Projetos</Label>
                  <Select value={managerId} onValueChange={setManagerId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{managers.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Separator />
                <Label className="text-xs text-muted-foreground">Produtos</Label>
                <div className="grid gap-1">
                  {allProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Checkbox checked={selectedProducts.includes(p.id)} onCheckedChange={c => setSelectedProducts(prev => c ? [...prev, p.id] : prev.filter(x => x !== p.id))} />
                      <span className="text-sm">{p.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div><span className="text-xs text-muted-foreground">Executivo de Vendas</span><p>{project.executive?.full_name || "—"}</p></div>
                <div><span className="text-xs text-muted-foreground">Gerente de Projetos</span><p>{project.manager?.full_name || "—"}</p></div>
                <Separator />
                <div>
                  <span className="text-xs text-muted-foreground">Produtos Contratados</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.project_products?.length > 0
                      ? project.project_products.map((pp: any, i: number) => <Badge key={i} variant="secondary">{pp.product?.name}</Badge>)
                      : <span className="text-sm text-muted-foreground">Nenhum</span>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attachments */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Anexos</CardTitle>
          <label>
            <input type="file" className="hidden" onChange={handleUpload} />
            <Button size="sm" variant="outline" asChild><span><Upload className="mr-1 h-4 w-4" /> Upload</span></Button>
          </label>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum anexo.</p>
          ) : (
            <div className="space-y-2">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{att.file_name}</span>
                    <span className="text-xs text-muted-foreground">{att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB` : ""}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteAttachment(att)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Histórico de Alterações</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem histórico.</p>
          ) : (
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium capitalize">{h.change_type}</span>
                    <span className="text-muted-foreground ml-2">{format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}</span>
                    {h.new_values && <p className="text-xs text-muted-foreground mt-0.5">{JSON.stringify(h.new_values)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
