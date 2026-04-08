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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { ArrowLeft, Edit2, Save, X, CalendarIcon, Upload, FileText, Trash2, Info, Download, Eye, PlusCircle, RefreshCw, User } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type BrazilianState = Database["public"]["Enums"]["brazilian_state"];

const statusLabels: Record<ProjectStatus, string> = {
  comercial: "Comercial", planejamento: "Planejamento", implantacao: "Implantação", encerrado: "Implementado", suspenso: "Suspenso",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
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
  const [installationTransmobile, setInstallationTransmobile] = useState<string>("0");
  const [installationClient, setInstallationClient] = useState<string>("0");
  const [complementarySale, setComplementarySale] = useState(false);
  const [complementaryFleet, setComplementaryFleet] = useState<string>("0");
  const [observations, setObservations] = useState("");

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
      setInstallationTransmobile(data.installation_transmobile?.toString() || "0");
      setInstallationClient(data.installation_client?.toString() || "0");
      setComplementarySale(data.complementary_sale || false);
      setComplementaryFleet(data.complementary_fleet?.toString() || "0");
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    if (!id) return;
    const { data } = await supabase.from("project_history").select("*").eq("project_id", id).order("created_at", { ascending: false });
    if (!data) { setHistory([]); return; }
    // Fetch profile names for changed_by
    const userIds = [...new Set(data.map(h => h.changed_by).filter(Boolean))] as string[];
    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      if (profiles) profiles.forEach(p => { profileMap[p.user_id] = p.full_name || "Usuário"; });
    }
    setHistory(data.map(h => ({ ...h, _user_name: h.changed_by ? (profileMap[h.changed_by] || "Usuário") : "Sistema" })));
  };

  useEffect(() => {
    loadProject();
    if (id) {
      loadHistory();
      supabase.from("project_attachments").select("*").eq("project_id", id).order("created_at", { ascending: false }).then(({ data }) => setAttachments(data || []));
    }
    supabase.from("team_members").select("id, full_name").eq("role", "executivo_vendas").eq("active", true).then(({ data }) => setExecutives(data || []));
    supabase.from("team_members").select("id, full_name").eq("role", "gerente_projetos").eq("active", true).then(({ data }) => setManagers(data || []));
    supabase.from("products").select("id, name").eq("active", true).then(({ data }) => setAllProducts(data || []));
    supabase.from("project_types").select("id, name").eq("active", true).then(({ data }) => setProjectTypes(data || []));
    supabase.from("solutions").select("id, name").eq("active", true).then(({ data }) => setAllSolutions(data || []));
  }, [id]);

  const buildChanges = () => {
    const changes: { field: string; from: string; to: string }[] = [];
    const str = (v: any) => v == null ? "" : String(v);
    const add = (label: string, oldVal: any, newVal: any) => {
      if (str(oldVal) !== str(newVal)) changes.push({ field: label, from: str(oldVal) || "—", to: str(newVal) || "—" });
    };

    add("Empresa", project.company_name, companyName);
    add("Cidade", project.city, city);
    add("Estado", project.state, state);
    add("Status", statusLabels[project.status as ProjectStatus], statusLabels[status]);
    
    const oldTypeName = project.project_type?.name || "—";
    const newTypeName = projectTypes.find(t => t.id === projectTypeId)?.name || "—";
    add("Tipo de Projeto", oldTypeName, newTypeName);
    
    add("Frota Contratada", project.fleet_size, fleetSize);
    add("Prazo Implantação (dias)", project.implementation_deadline_days, implDeadlineDays);
    add("Prazo Contratual (dias)", project.contractual_deadline_days, contractualDeadlineDays);
    add("Piloto", project.is_pilot ? "Sim" : "Não", isPilot ? "Sim" : "Não");

    const oldExec = project.executive?.full_name || "—";
    const newExec = executives.find(e => e.id === executiveId)?.full_name || "—";
    add("Executivo de Vendas", oldExec, newExec);

    const oldMgr = project.manager?.full_name || "—";
    const newMgr = managers.find(m => m.id === managerId)?.full_name || "—";
    add("Gestor de Projetos", oldMgr, newMgr);

    add("Data do Contrato", fmtDate(project.contract_date), contractDate ? format(contractDate, "dd/MM/yyyy") : "—");
    add("Data D-Zero", fmtDate(project.d_zero_date), dZeroDate ? format(dZeroDate, "dd/MM/yyyy") : "—");
    add("Data de Entrega", fmtDate(project.handover_date), handoverDate ? format(handoverDate, "dd/MM/yyyy") : "—");

    const oldSols = (project.project_solutions?.map((ps: any) => ps.solution?.name).filter(Boolean) || []).sort().join(", ") || "—";
    const newSols = selectedSolutions.map(sid => allSolutions.find(s => s.id === sid)?.name).filter(Boolean).sort().join(", ") || "—";
    add("Soluções", oldSols, newSols);

    if (isPilot) add("Info Piloto", project.pilot_info || "—", pilotInfo || "—");
    add("Instalação Transmobile", project.installation_transmobile ?? 0, parseInt(installationTransmobile) || 0);
    add("Instalação Cliente", project.installation_client ?? 0, parseInt(installationClient) || 0);
    add("Venda Complementar", project.complementary_sale ? "Sim" : "Não", complementarySale ? "Sim" : "Não");
    if (complementarySale) add("Frota Complementar", project.complementary_fleet ?? 0, parseInt(complementaryFleet) || 0);

    return changes;
  };

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
      const changes = buildChanges();

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
        installation_transmobile: parseInt(installationTransmobile) || 0,
        installation_client: parseInt(installationClient) || 0,
        complementary_sale: complementarySale,
        complementary_fleet: complementarySale ? (parseInt(complementaryFleet) || 0) : 0,
      }).eq("id", id);
      if (error) throw error;

      // Update solutions
      await supabase.from("project_solutions").delete().eq("project_id", id);
      if (selectedSolutions.length > 0) {
        await supabase.from("project_solutions").insert(selectedSolutions.map(sid => ({ project_id: id, solution_id: sid })));
      }

      if (changes.length > 0) {
        await supabase.from("project_history").insert({
          project_id: id,
          change_type: "updated",
          changed_by: user?.id || null,
          old_values: { changes: changes.map(c => ({ field: c.field, value: c.from })) },
          new_values: { changes },
        });
      }

      toast({ title: "Projeto atualizado!" });
      setEditing(false);
      loadProject();
      loadHistory();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const ATTACHMENT_CATEGORIES = [
    { key: "contrato", label: "Contrato", prefix: "[Contrato]" },
    { key: "proposta", label: "Proposta Comercial", prefix: "[Proposta Comercial]" },
    { key: "ata", label: "Ata de Reunião", prefix: "[Ata de Reunião]" },
    { key: "outros", label: "Demais Documentos", prefix: "[Demais Documentos]" },
  ];

  const getAttachmentsForCategory = (prefix: string) => {
    return attachments.filter(a => a.file_name?.startsWith(prefix));
  };

  const getUncategorizedAttachments = () => {
    const prefixes = ATTACHMENT_CATEGORIES.map(c => c.prefix);
    return attachments.filter(a => !prefixes.some(p => a.file_name?.startsWith(p)));
  };

  const handleCategoryUpload = async (category: typeof ATTACHMENT_CATEGORIES[0], e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id) return;

    setUploading(true);
    const fileList = Array.from(files);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress({ current: i + 1, total: fileList.length, fileName: file.name });
        if (file.size > 20 * 1024 * 1024) {
          toast({ title: `Arquivo "${file.name}" excede 20MB`, variant: "destructive" });
          continue;
        }
        const sanitizedName = file.name
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${id}/${Date.now()}_${sanitizedName}`;
        const { error: upErr } = await supabase.storage.from("project-attachments").upload(path, file);
        if (upErr) { toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" }); continue; }
        const { error: insertErr } = await supabase.from("project_attachments").insert({
          project_id: id,
          file_name: `${category.prefix} ${file.name}`,
          file_path: path,
          file_size: file.size,
          content_type: file.type,
          uploaded_by: user?.id || null,
        });
        if (insertErr) { toast({ title: "Erro ao registrar anexo", description: insertErr.message, variant: "destructive" }); continue; }
      }
      toast({ title: "Arquivo(s) anexado(s)!" });
      const { data: refreshed } = await supabase.from("project_attachments").select("*").eq("project_id", id).order("created_at", { ascending: false });
      setAttachments(refreshed || []);
    } finally {
      setUploading(false);
      setUploadProgress(null);
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
        ) : isAdmin ? (
          <Button size="sm" onClick={() => setEditing(true)}><Edit2 className="mr-1 h-4 w-4" /> Editar</Button>
        ) : null}
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

      {/* Instalação Embarcada */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Instalação Embarcada</CardTitle>
          <CardDescription>Quantidade de instalações realizadas por cada responsável</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Transmobile</Label>
                <Input type="number" min={0} step={1} value={installationTransmobile} onChange={e => setInstallationTransmobile(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <Input type="number" min={0} step={1} value={installationClient} onChange={e => setInstallationClient(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div><span className="text-xs text-muted-foreground">Transmobile</span><p>{project.installation_transmobile ?? 0}</p></div>
              <div><span className="text-xs text-muted-foreground">Cliente</span><p>{project.installation_client ?? 0}</p></div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Venda Complementar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Venda Complementar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <>
              <div className="flex items-center gap-3">
                <Switch checked={complementarySale} onCheckedChange={setComplementarySale} />
                <Label>Possui venda complementar?</Label>
              </div>
              {complementarySale && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Frota Complementar</Label>
                  <Input type="number" min={0} step={1} value={complementaryFleet} onChange={e => setComplementaryFleet(e.target.value)} />
                </div>
              )}
            </>
          ) : (
            <>
              <div><span className="text-xs text-muted-foreground">Venda Complementar</span><p>{project.complementary_sale ? "Sim" : "Não"}</p></div>
              {project.complementary_sale && (
                <div><span className="text-xs text-muted-foreground">Frota Complementar</span><p>{project.complementary_fleet ?? 0}</p></div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Attachments - Categorized */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Anexos</CardTitle>
          <CardDescription className="text-xs">Anexe documentos relacionados ao projeto (máx. 20MB cada)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {uploading && uploadProgress && (
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Enviando arquivo {uploadProgress.current} de {uploadProgress.total}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                </span>
              </div>
              <Progress value={(uploadProgress.current / uploadProgress.total) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground truncate">{uploadProgress.fileName}</p>
            </div>
          )}
          {ATTACHMENT_CATEGORIES.map(cat => {
            const catFiles = getAttachmentsForCategory(cat.prefix);
            return (
              <div key={cat.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{cat.label}</Label>
                  <label>
                    <input type="file" className="hidden" onChange={e => handleCategoryUpload(cat, e)} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv" />
                    <Button size="sm" variant="outline" asChild disabled={uploading}>
                      <span><Upload className="mr-1 h-3.5 w-3.5" /> Anexar</span>
                    </Button>
                  </label>
                </div>
                {catFiles.length > 0 ? (
                  <div className="space-y-1.5">
                    {catFiles.map(att => {
                      const isPdf = att.content_type === "application/pdf" || att.file_name?.toLowerCase().endsWith(".pdf");
                      const isImage = att.content_type?.startsWith("image/");
                      const canPreview = isPdf || isImage;
                      const displayName = att.file_name?.replace(cat.prefix + " ", "") || att.file_name;
                      return (
                        <div key={att.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{displayName}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB` : ""}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {canPreview && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(att)} title="Visualizar">
                                <Eye className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(att)} title="Baixar">
                              <Download className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAttachment(att)} title="Excluir">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum arquivo anexado</p>
                )}
              </div>
            );
          })}

          {/* Uncategorized attachments (legacy) */}
          {getUncategorizedAttachments().length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Outros (anteriores)</Label>
              <div className="space-y-1.5">
                {getUncategorizedAttachments().map(att => {
                  const isPdf = att.content_type === "application/pdf" || att.file_name?.toLowerCase().endsWith(".pdf");
                  const isImage = att.content_type?.startsWith("image/");
                  const canPreview = isPdf || isImage;
                  return (
                    <div key={att.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{att.file_name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB` : ""}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {canPreview && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(att)} title="Visualizar">
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(att)} title="Baixar">
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAttachment(att)} title="Excluir">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            <div className="space-y-4">
              {history.map(h => {
                const isCreated = h.change_type === "created";
                const changes = h.new_values?.changes as { field: string; from?: string; to?: string }[] | undefined;
                return (
                  <div key={h.id} className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", isCreated ? "text-blue-600" : "text-green-600")}>
                        {isCreated ? <PlusCircle className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                        {isCreated ? "Criado" : "Atualizado"}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>Por: <span className="font-medium text-foreground">{h._user_name || "Sistema"}</span></span>
                    </div>
                    {isCreated ? (
                      <p className="text-sm text-muted-foreground">Projeto cadastrado com os dados iniciais</p>
                    ) : changes && changes.length > 0 ? (
                      <div className="space-y-1 pt-1">
                        {changes.map((c, i) => (
                          <div key={i} className="text-sm flex items-start gap-1">
                            <span className="font-medium text-muted-foreground min-w-[140px]">{c.field}:</span>
                            <span className="text-destructive/70 line-through">{c.from || "—"}</span>
                            <span className="text-muted-foreground mx-1">→</span>
                            <span className="text-foreground font-medium">{c.to || "—"}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{h.new_values ? JSON.stringify(h.new_values) : "Sem detalhes"}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
