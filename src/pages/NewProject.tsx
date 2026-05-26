import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Save, Info, Upload, FileText, X } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type BrazilianState = Database["public"]["Enums"]["brazilian_state"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];

const statusLabels: Record<ProjectStatus, string> = {
  comercial: "Comercial",
  planejamento: "Planejamento",
  implantacao: "Implantação",
  encerrado: "Implementado",
  suspenso: "Outros",
};

export default function NewProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Dados gerais
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState<BrazilianState | "">("");
  const [contractDate, setContractDate] = useState<Date>();
  const [dZeroDate, setDZeroDate] = useState<Date>();
  const [handoverDate, setHandoverDate] = useState<Date>();
  const [executiveId, setExecutiveId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planejamento");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Novos campos
  const [projectTypeId, setProjectTypeId] = useState("");
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>([]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [fleetSize, setFleetSize] = useState<string>("");
  const [implDeadlineDays, setImplDeadlineDays] = useState<string>("");
  const [contractualDeadlineDays, setContractualDeadlineDays] = useState<string>("");
  const [isPilot, setIsPilot] = useState(false);
  const [pilotInfo, setPilotInfo] = useState("");
  const [installationTransmobile, setInstallationTransmobile] = useState<string>("0");
  const [installationClient, setInstallationClient] = useState<string>("0");
  const [complementarySale, setComplementarySale] = useState(false);
  const [complementaryFleet, setComplementaryFleet] = useState<string>("0");

  // Anexos por categoria
  const ATTACHMENT_CATEGORIES = [
    { key: "contrato", label: "Contrato" },
    { key: "proposta", label: "Proposta Comercial" },
    { key: "ata", label: "Ata de Reunião" },
    { key: "outros", label: "Demais Documentos" },
  ] as const;

  const [attachmentFiles, setAttachmentFiles] = useState<Record<string, File[]>>({
    contrato: [],
    proposta: [],
    ata: [],
    outros: [],
  });

  // Lookups (hardcoded)
  const [executives, setExecutives] = useState<{ id: string; full_name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<{ id: string; name: string }[]>([]);
  const [solutions, setSolutions] = useState<{ id: string; name: string }[]>([]);
  const [integrations, setIntegrations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from("team_members").select("id, full_name").eq("role", "executivo_vendas").eq("active", true).then(({ data }) => setExecutives(data || []));
    supabase.from("team_members").select("id, full_name").eq("role", "gerente_projetos").eq("active", true).then(({ data }) => setManagers(data || []));
    supabase.from("products").select("id, name").eq("active", true).then(({ data }) => setProducts(data || []));
    supabase.from("project_types").select("id, name").eq("active", true).then(({ data }) => setProjectTypes(data || []));
    supabase.from("solutions").select("id, name").eq("active", true).then(({ data }) => setSolutions(data || []));
    supabase.from("integrations").select("id, name").eq("active", true).then(({ data }) => setIntegrations(data || []));
  }, []);

  // Datas calculadas
  const implEndDate = useMemo(() => {
    if (contractDate && implDeadlineDays && parseInt(implDeadlineDays) > 0) {
      return addDays(contractDate, parseInt(implDeadlineDays));
    }
    return null;
  }, [contractDate, implDeadlineDays]);

  const contractEndDate = useMemo(() => {
    if (contractDate && contractualDeadlineDays && parseInt(contractualDeadlineDays) > 0) {
      return addDays(contractDate, parseInt(contractualDeadlineDays));
    }
    return null;
  }, [contractDate, contractualDeadlineDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!companyName || !city || !state || !contractDate) {
      toast({ title: "Preencha os campos obrigatórios de Dados Gerais", variant: "destructive" });
      return;
    }
    if (!projectTypeId) {
      toast({ title: "Selecione o Tipo do Projeto", variant: "destructive" });
      return;
    }
    if (selectedSolutions.length === 0) {
      toast({ title: "Selecione pelo menos uma Solução", variant: "destructive" });
      return;
    }
    const fleet = parseInt(fleetSize);
    if (!fleetSize || isNaN(fleet) || fleet < 1) {
      toast({ title: "Informe a Frota Contratada (mínimo 1)", variant: "destructive" });
      return;
    }
    const implDays = parseInt(implDeadlineDays);
    if (!implDeadlineDays || isNaN(implDays) || implDays < 1) {
      toast({ title: "Informe o Prazo de Implantação", variant: "destructive" });
      return;
    }
    const contrDays = parseInt(contractualDeadlineDays);
    if (!contractualDeadlineDays || isNaN(contrDays) || contrDays < 1) {
      toast({ title: "Informe o Prazo Contratual", variant: "destructive" });
      return;
    }
    if (isPilot && !pilotInfo.trim()) {
      toast({ title: "Informe as informações adicionais do Piloto", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: project, error } = await supabase.from("projects").insert({
        company_name: companyName,
        city,
        state: state as BrazilianState,
        contract_date: format(contractDate, "yyyy-MM-dd"),
        d_zero_date: dZeroDate ? format(dZeroDate, "yyyy-MM-dd") : null,
        handover_date: handoverDate ? format(handoverDate, "yyyy-MM-dd") : null,
        executive_id: executiveId || null,
        manager_id: managerId || null,
        status,
        created_by: user?.id || null,
        project_type_id: projectTypeId,
        fleet_size: fleet,
        implementation_deadline_days: implDays,
        contractual_deadline_days: contrDays,
        is_pilot: isPilot,
        pilot_info: isPilot ? pilotInfo : null,
        filled_by: user?.id || null,
        installation_transmobile: parseInt(installationTransmobile) || 0,
        installation_client: parseInt(installationClient) || 0,
        complementary_sale: complementarySale,
        complementary_fleet: complementarySale ? (parseInt(complementaryFleet) || 0) : 0,
      }).select("id").single();
      if (error) throw error;

      // Produtos
      if (selectedProducts.length > 0) {
        await supabase.from("project_products").insert(selectedProducts.map(pid => ({ project_id: project.id, product_id: pid })));
      }

      // Soluções
      if (selectedSolutions.length > 0) {
        await supabase.from("project_solutions").insert(selectedSolutions.map(sid => ({ project_id: project.id, solution_id: sid })));
      }

      // Integrações
      if (selectedIntegrations.length > 0) {
        await supabase.from("project_integrations").insert(selectedIntegrations.map(iid => ({ project_id: project.id, integration_id: iid })));
      }

      // Histórico
      await supabase.from("project_history").insert({
        project_id: project.id,
        change_type: "created",
        changed_by: user?.id || null,
        new_values: { company_name: companyName, city, state, status, fleet_size: fleet, is_pilot: isPilot },
      });

      // Upload de anexos
      for (const cat of ATTACHMENT_CATEGORIES) {
        const files = attachmentFiles[cat.key];
        for (const file of files) {
          const path = `${project.id}/${Date.now()}_${file.name}`;
          const { error: upErr } = await supabase.storage.from("project-attachments").upload(path, file);
          if (upErr) continue;
          await supabase.from("project_attachments").insert({
            project_id: project.id,
            file_name: `[${cat.label}] ${file.name}`,
            file_path: path,
            file_size: file.size,
            content_type: file.type,
            uploaded_by: user?.id || null,
          });
        }
      }

      toast({ title: "Projeto criado com sucesso!" });
      navigate("/projetos/lista");
    } catch (err: any) {
      toast({ title: "Erro ao criar projeto", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const DatePicker = ({ label, date, onSelect, required }: { label: string; date?: Date; onSelect: (d?: Date) => void; required?: boolean }) => (
    <div className="space-y-2">
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "dd/MM/yyyy") : "Selecione..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className="p-3 pointer-events-auto" captionLayout="dropdown-buttons" fromYear={2015} toYear={2035} />
          </PopoverContent>
        </Popover>
        {date && (
          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onSelect(undefined)} title="Limpar data">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const HelperText = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
      <Info className="h-3 w-3" /> {children}
    </p>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/projetos")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      <h1 className="text-2xl font-bold mb-6">Cadastrar Novo Projeto</h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* === SEÇÃO: PROJETO === */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projeto</CardTitle>
            <CardDescription>Dados gerais do projeto e contrato</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Nome da Empresa <span className="text-destructive">*</span></Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex.: TransMobile Ltda." required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Cidade <span className="text-destructive">*</span></Label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex.: São Paulo" required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Estado <span className="text-destructive">*</span></Label>
              <Select value={state || undefined} onValueChange={v => setState(v as BrazilianState)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {Constants.public.Enums.brazilian_state.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo do Projeto <span className="text-destructive">*</span></Label>
              <Select value={projectTypeId || undefined} onValueChange={setProjectTypeId}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                <SelectContent>
                  {projectTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frota Contratada <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={fleetSize}
                onChange={e => setFleetSize(e.target.value)}
                placeholder="Ex.: 50"
              />
              <HelperText>Quantidade de veículos do contrato</HelperText>
            </div>
            <DatePicker label="Data de Contratação" date={contractDate} onSelect={setContractDate} required />
            <DatePicker label="Data D-zero" date={dZeroDate} onSelect={setDZeroDate} />
            <DatePicker label="Data Handover" date={handoverDate} onSelect={setHandoverDate} />
          </CardContent>
        </Card>

        {/* === SEÇÃO: SOLUÇÕES / ESCOPO === */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Soluções / Escopo</CardTitle>
            <CardDescription>Soluções contratadas e produtos do projeto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Soluções <span className="text-destructive">*</span></Label>
              {solutions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma solução cadastrada.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-3">
                  {solutions.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedSolutions.includes(s.id)}
                        onCheckedChange={checked => {
                          setSelectedSolutions(prev => checked ? [...prev, s.id] : prev.filter(x => x !== s.id));
                        }}
                      />
                      <span className="text-sm">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* === SEÇÃO: INTEGRAÇÕES === */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Integrações</CardTitle>
            <CardDescription>Integrações contratadas para o projeto</CardDescription>
          </CardHeader>
          <CardContent>
            {integrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma integração cadastrada.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {integrations.map(ig => (
                  <div key={ig.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIntegrations.includes(ig.id)}
                      onCheckedChange={checked => {
                        setSelectedIntegrations(prev => checked ? [...prev, ig.id] : prev.filter(x => x !== ig.id));
                      }}
                    />
                    <span className="text-sm">{ig.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* === SEÇÃO: PRAZOS === */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prazos</CardTitle>
            <CardDescription>Prazos de implantação e contrato</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prazo de Implantação (dias) <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={implDeadlineDays}
                onChange={e => setImplDeadlineDays(e.target.value)}
                placeholder="Ex.: 90"
              />
              {implEndDate && (
                <HelperText>
                  Data prevista de finalização: {format(implEndDate, "dd/MM/yyyy")}
                </HelperText>
              )}
              {!contractDate && implDeadlineDays && (
                <HelperText>Preencha a Data de Contratação para calcular a data prevista</HelperText>
              )}
            </div>
            <div className="space-y-2">
              <Label>Prazo Contratual (dias) <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={contractualDeadlineDays}
                onChange={e => setContractualDeadlineDays(e.target.value)}
                placeholder="Ex.: 365"
              />
              {contractEndDate && (
                <HelperText>
                  Data de finalização do contrato: {format(contractEndDate, "dd/MM/yyyy")}
                </HelperText>
              )}
              {!contractDate && contractualDeadlineDays && (
                <HelperText>Preencha a Data de Contratação para calcular a data</HelperText>
              )}
            </div>
          </CardContent>
        </Card>

        {/* === SEÇÃO: EQUIPE === */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Equipe</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Gerente Comercial</Label>
              <Select value={executiveId || undefined} onValueChange={setExecutiveId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {executives.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gerente de Projetos</Label>
              <Select value={managerId || undefined} onValueChange={setManagerId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* === SEÇÃO: PILOTO === */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Piloto</CardTitle>
            <CardDescription>Marque se este projeto é um piloto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={isPilot} onCheckedChange={setIsPilot} />
              <Label>Projeto é piloto?</Label>
            </div>
            {isPilot && (
              <div className="space-y-2">
                <Label>Informação Adicional (Piloto) <span className="text-destructive">*</span></Label>
                <Textarea
                  value={pilotInfo}
                  onChange={e => setPilotInfo(e.target.value)}
                  placeholder="Descreva informações relevantes sobre o piloto..."
                  rows={3}
                  maxLength={2000}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* === SEÇÃO: INSTALAÇÃO EMBARCADA === */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instalação Embarcada</CardTitle>
            <CardDescription>Quantidade de instalações realizadas por cada responsável</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Transmobile</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={installationTransmobile}
                onChange={e => setInstallationTransmobile(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={installationClient}
                onChange={e => setInstallationClient(e.target.value)}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* === SEÇÃO: VENDA COMPLEMENTAR === */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Venda Complementar</CardTitle>
            <CardDescription>Indica se o projeto possui venda complementar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={complementarySale} onCheckedChange={setComplementarySale} />
              <Label>Possui venda complementar?</Label>
            </div>
            {complementarySale && (
              <div className="space-y-2">
                <Label>Frota Complementar</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={complementaryFleet}
                  onChange={e => setComplementaryFleet(e.target.value)}
                  placeholder="0"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* === SEÇÃO: STATUS === */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Status</CardTitle></CardHeader>
          <CardContent>
            <Select value={status} onValueChange={v => setStatus(v as ProjectStatus)}>
              <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Constants.public.Enums.project_status.map(s => (
                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* === SEÇÃO: ANEXOS === */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anexos</CardTitle>
            <CardDescription>Anexe documentos relacionados ao projeto (máx. 20MB cada)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {ATTACHMENT_CATEGORIES.map(cat => {
              const files = attachmentFiles[cat.key];
              const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const newFiles = e.target.files;
                if (!newFiles) return;
                const validFiles = Array.from(newFiles).filter(f => f.size <= 20 * 1024 * 1024);
                if (validFiles.length < (newFiles?.length || 0)) {
                  toast({ title: "Arquivos acima de 20MB foram ignorados", variant: "destructive" });
                }
                setAttachmentFiles(prev => ({
                  ...prev,
                  [cat.key]: [...prev[cat.key], ...validFiles],
                }));
                e.target.value = "";
              };
              const removeFile = (idx: number) => {
                setAttachmentFiles(prev => ({
                  ...prev,
                  [cat.key]: prev[cat.key].filter((_, i) => i !== idx),
                }));
              };
              return (
                <div key={cat.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{cat.label}</Label>
                    <label>
                      <input type="file" className="hidden" onChange={handleFileChange} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv" />
                      <Button type="button" size="sm" variant="outline" asChild>
                        <span><Upload className="mr-1 h-3.5 w-3.5" /> Anexar</span>
                      </Button>
                    </label>
                  </div>
                  {files.length > 0 && (
                    <div className="space-y-1.5">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(idx)}>
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {files.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Nenhum arquivo anexado</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* === SEÇÃO: AUDITORIA === */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Auditoria</CardTitle>
            <CardDescription>Responsável pelo preenchimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Preenchido por</Label>
              <Input
                value={user?.email || "Usuário logado"}
                disabled
                className="bg-muted"
              />
              <HelperText>Registrado automaticamente com o usuário logado</HelperText>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/projetos")}>Cancelar</Button>
          <Button type="submit" disabled={submitting}>
            <Save className="mr-2 h-4 w-4" /> {submitting ? "Salvando..." : "Salvar Projeto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
