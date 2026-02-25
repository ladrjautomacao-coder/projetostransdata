import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { ArrowLeft, Edit2, Save, X, CalendarIcon, Upload, FileText, Trash2, Info, Download, Eye } from "lucide-react";
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

  // Edit state - existing
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

  // Edit state - new fields
  const [projectTypeId, setProjectTypeId] = useState("");
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>([]);
  const [fleetSize, setFleetSize] = useState<string>("");
  const [implDeadlineDays, setImplDeadlineDays] = useState<string>("");
  const [contractualDeadlineDays, setContractualDeadlineDays] = useState<string>("");
  const [isPilot, setIsPilot] = useState(false);
  const [pilotInfo, setPilotInfo] = useState("");

  // Lookups
  const [executives, setExecutives] = useState<{ id: string; full_name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<{ id: string; name: string }[]>([]);
  const [allSolutions, setAllSolutions] = useState<{ id: string; name: string }[]>([]);

  const implEndDate = useMemo(() => {
    if (contractDate && implDeadlineDays && parseInt(implDeadlineDays) > 0) return addDays(contractDate, parseInt(implDeadlineDays));
    return null;
  }, [contractDate, implDeadlineDays]);

  const contractEndDate = useMemo(() => {
    if (contractDate && contractualDeadlineDays && parseInt(contractualDeadlineDays) > 0) return addDays(contractDate, parseInt(contractualDeadlineDays));
    return null;
  }, [contractDate, contractualDeadlineDays]);

  const loadProject = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("projects")
      .select("*, executive:team_members!projects_executive_id_fkey(id,full_name), manager:team_members!projects_manager_id_fkey(id,full_name), project_products(product_id, product:products(id,name)), project_type:project_types(id,name), project_solutions(solution_id, solution:solutions(id,name))")
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
      setProjectTypeId(data.project_type_id || "");
      setSelectedSolutions(data.project_solutions?.map((ps: any) => ps.solution_id) || []);
      setFleetSize(data.fleet_size?.toString() || "");
      setImplDeadlineDays(data.implementation_deadline_days?.toString() || "");
      setContractualDeadlineDays(data.contractual_deadline_days?.toString() || "");
      setIsPilot(data.is_pilot || false);
      setPilotInfo(data.pilot_info || "");
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
    supabase.from("project_types").select("id, name").eq("active", true).then(({ data }) => setProjectTypes(data || []));
    supabase.from("solutions").select("id, name").eq("active", true).then(({ data }) => setAllSolutions(data || []));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    if (!projectTypeId) { toast({ title: "Selecione o Tipo do Projeto", variant: "destructive" }); return; }
    if (selectedSolutions.length === 0) { toast({ title: "Selecione pelo menos uma Solução", variant: "destructive" }); return; }
    const fleet = parseInt(fleetSize);
    if (!fleetSize || isNaN(fleet) || fleet < 1) { toast({ title: "Informe a Frota Contratada", variant: "destructive" }); return; }
    const implDays = parseInt(implDeadlineDays);
    if (!implDeadlineDays || isNaN(implDays) || implDays < 1) { toast({ title: "Informe o Prazo de Implantação", variant: "destructive" }); return; }
    const contrDays = parseInt(contractualDeadlineDays);
    if (!contractualDeadlineDays || isNaN(contrDays) || contrDays < 1) { toast({ title: "Informe o Prazo Contratual", variant: "destructive" }); return; }
    if (isPilot && !pilotInfo.trim()) { toast({ title: "Informe as informações do Piloto", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const oldValues = { company_name: project.company_name, city: project.city, state: project.state, status: project.status };
      const newValues = { company_name: companyName, city, state, status, fleet_size: fleet, is_pilot: isPilot };

      const { error } = await supabase.from("projects").update({
        company_name: companyName, city, state,
        contract_date: contractDate ? format(contractDate, "yyyy-MM-dd") : project.contract_date,
        d_zero_date: dZeroDate ? format(dZeroDate, "yyyy-MM-dd") : null,
        handover_date: handoverDate ? format(handoverDate, "yyyy-MM-dd") : null,
        executive_id: executiveId || null, manager_id: managerId || null, status,
        project_type_id: projectTypeId || null,
        fleet_size: fleet,
        implementation_deadline_days: implDays,
        contractual_deadline_days: contrDays,
        is_pilot: isPilot,
        pilot_info: isPilot ? pilotInfo : null,
      }).eq("id", id);
      if (error) throw error;

      // Update solutions
      await supabase.from("project_solutions").delete().eq("project_id", id);
      if (selectedSolutions.length > 0) {
        await supabase.from("project_solutions").insert(selectedSolutions.map(sid => ({ project_id: id, solution_id: sid })));
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

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const MAX_ATTACHMENTS = 10;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id) return;

    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      toast({ title: `Máximo de ${MAX_ATTACHMENTS} anexos permitidos`, variant: "destructive" });
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast({ title: `Arquivo "${file.name}" excede 20MB`, variant: "destructive" });
          continue;
        }
        const path = `${id}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("project-attachments").upload(path, file);
        if (upErr) { toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" }); continue; }
        await supabase.from("project_attachments").insert({ project_id: id, file_name: file.name, file_path: path, file_size: file.size, content_type: file.type, uploaded_by: user?.id || null });
      }
      toast({ title: "Arquivo(s) anexado(s)!" });
      supabase.from("project_attachments").select("*").eq("project_id", id).order("created_at", { ascending: false }).then(({ data }) => setAttachments(data || []));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (att: any) => {
    await supabase.storage.from("project-attachments").remove([att.file_path]);
    await supabase.from("project_attachments").delete().eq("id", att.id);
    setAttachments(prev => prev.filter(a => a.id !== att.id));
    toast({ title: "Anexo removido" });
  };

  const handleDownload = async (att: any) => {
    const { data } = await supabase.storage.from("project-attachments").createSignedUrl(att.file_path, 60);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = att.file_name;
      a.target = "_blank";
      a.click();
    }
  };

  const handlePreview = async (att: any) => {
    const { data } = await supabase.storage.from("project-attachments").createSignedUrl(att.file_path, 300);
    if (data?.signedUrl) {
      setPreviewName(att.file_name);
      setPreviewUrl(data.signedUrl);
    }
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

  const HelperText = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <Info className="h-3 w-3" /> {children}
    </p>
  );

  const timeline = [
    { label: "Contratação", date: project.contract_date, done: true },
    { label: "D-zero", date: project.d_zero_date, done: !!project.d_zero_date },
    { label: "Handover", date: project.handover_date, done: !!project.handover_date },
  ];

  const projectTypeName = project.project_type?.name || "—";
  const solutionNames = project.project_solutions?.map((ps: any) => ps.solution?.name).filter(Boolean) || [];

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

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Dados Gerais */}
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
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tipo do Projeto</Label>
                  <Select value={projectTypeId} onValueChange={setProjectTypeId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{projectTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Frota Contratada</Label>
                  <Input type="number" min={1} step={1} value={fleetSize} onChange={e => setFleetSize(e.target.value)} />
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
                <div><span className="text-xs text-muted-foreground">Tipo do Projeto</span><p>{projectTypeName}</p></div>
                <div><span className="text-xs text-muted-foreground">Frota Contratada</span><p>{project.fleet_size ?? "—"} veículos</p></div>
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

        {/* Equipe & Soluções */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Equipe & Soluções</CardTitle></CardHeader>
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
                <Label className="text-xs text-muted-foreground">Soluções</Label>
                <div className="grid gap-1">
                  {allSolutions.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Checkbox checked={selectedSolutions.includes(s.id)} onCheckedChange={c => setSelectedSolutions(prev => c ? [...prev, s.id] : prev.filter(x => x !== s.id))} />
                      <span className="text-sm">{s.name}</span>
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
                  <span className="text-xs text-muted-foreground">Soluções</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {solutionNames.length > 0
                      ? solutionNames.map((name: string, i: number) => <Badge key={i} variant="default">{name}</Badge>)
                      : <span className="text-sm text-muted-foreground">Nenhuma</span>}
                  </div>
                </div>
              
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prazos & Piloto */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Prazos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prazo de Implantação (dias)</Label>
                  <Input type="number" min={1} step={1} value={implDeadlineDays} onChange={e => setImplDeadlineDays(e.target.value)} />
                  {implEndDate && <HelperText>Finalização prevista: {format(implEndDate, "dd/MM/yyyy")}</HelperText>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prazo Contratual (dias)</Label>
                  <Input type="number" min={1} step={1} value={contractualDeadlineDays} onChange={e => setContractualDeadlineDays(e.target.value)} />
                  {contractEndDate && <HelperText>Fim do contrato: {format(contractEndDate, "dd/MM/yyyy")}</HelperText>}
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-xs text-muted-foreground">Prazo de Implantação</span>
                  <p>{project.implementation_deadline_days ? `${project.implementation_deadline_days} dias` : "—"}</p>
                  {project.implementation_deadline_days && project.contract_date && (
                    <HelperText>Finalização prevista: {format(addDays(new Date(project.contract_date + "T00:00:00"), project.implementation_deadline_days), "dd/MM/yyyy")}</HelperText>
                  )}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Prazo Contratual</span>
                  <p>{project.contractual_deadline_days ? `${project.contractual_deadline_days} dias` : "—"}</p>
                  {project.contractual_deadline_days && project.contract_date && (
                    <HelperText>Fim do contrato: {format(addDays(new Date(project.contract_date + "T00:00:00"), project.contractual_deadline_days), "dd/MM/yyyy")}</HelperText>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Piloto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <>
                <div className="flex items-center gap-3">
                  <Switch checked={isPilot} onCheckedChange={setIsPilot} />
                  <Label>Projeto é piloto?</Label>
                </div>
                {isPilot && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Informação Adicional</Label>
                    <Textarea value={pilotInfo} onChange={e => setPilotInfo(e.target.value)} rows={3} maxLength={2000} />
                  </div>
                )}
              </>
            ) : (
              <>
                <div><span className="text-xs text-muted-foreground">Projeto Piloto</span><p>{project.is_pilot ? "Sim" : "Não"}</p></div>
                {project.is_pilot && project.pilot_info && (
                  <div><span className="text-xs text-muted-foreground">Informação Adicional</span><p className="text-sm">{project.pilot_info}</p></div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attachments */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Anexos</CardTitle>
            <CardDescription className="text-xs">{attachments.length}/{MAX_ATTACHMENTS} arquivos</CardDescription>
          </div>
          {attachments.length < MAX_ATTACHMENTS && (
            <label>
              <input type="file" className="hidden" onChange={handleUpload} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv" />
              <Button size="sm" variant="outline" asChild disabled={uploading}>
                <span><Upload className="mr-1 h-4 w-4" /> {uploading ? "Enviando..." : "Upload"}</span>
              </Button>
            </label>
          )}
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum anexo.</p>
          ) : (
            <div className="space-y-2">
              {attachments.map(att => {
                const isPdf = att.content_type === "application/pdf" || att.file_name?.toLowerCase().endsWith(".pdf");
                const isImage = att.content_type?.startsWith("image/");
                const canPreview = isPdf || isImage;
                return (
                  <div key={att.id} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{att.file_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB` : ""}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canPreview && (
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(att)} title="Visualizar">
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(att)} title="Baixar">
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAttachment(att)} title="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={open => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm truncate">{previewName}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe src={previewUrl} className="w-full flex-1 border-0 rounded-b-lg" style={{ height: "calc(80vh - 60px)" }} />
          )}
        </DialogContent>
      </Dialog>

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
