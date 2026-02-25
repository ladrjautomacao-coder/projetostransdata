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
import { CalendarIcon, ArrowLeft, Save, Info } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type BrazilianState = Database["public"]["Enums"]["brazilian_state"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];

const statusLabels: Record<ProjectStatus, string> = {
  planejamento: "Planejamento",
  implantacao: "Implantação",
  encerrado: "Encerrado",
  suspenso: "Suspenso",
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
  const [fleetSize, setFleetSize] = useState<string>("");
  const [implDeadlineDays, setImplDeadlineDays] = useState<string>("");
  const [contractualDeadlineDays, setContractualDeadlineDays] = useState<string>("");
  const [isPilot, setIsPilot] = useState(false);
  const [pilotInfo, setPilotInfo] = useState("");

  // Lookups
  const [executives, setExecutives] = useState<{ id: string; full_name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<{ id: string; name: string }[]>([]);
  const [solutions, setSolutions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from("team_members").select("id, full_name").eq("role", "executivo_vendas").eq("active", true).then(({ data }) => setExecutives(data || []));
    supabase.from("team_members").select("id, full_name").eq("role", "gerente_projetos").eq("active", true).then(({ data }) => setManagers(data || []));
    supabase.from("products").select("id, name").eq("active", true).then(({ data }) => setProducts(data || []));
    supabase.from("project_types").select("id, name").eq("active", true).then(({ data }) => setProjectTypes(data || []));
    supabase.from("solutions").select("id, name").eq("active", true).then(({ data }) => setSolutions(data || []));
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

      // Histórico
      await supabase.from("project_history").insert({
        project_id: project.id,
        change_type: "created",
        changed_by: user?.id || null,
        new_values: { company_name: companyName, city, state, status, fleet_size: fleet, is_pilot: isPilot },
      });

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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy") : "Selecione..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
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
              <Select value={state} onValueChange={v => setState(v as BrazilianState)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.brazilian_state.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo do Projeto <span className="text-destructive">*</span></Label>
              <Select value={projectTypeId} onValueChange={setProjectTypeId}>
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
              <Label>Executivo de Vendas</Label>
              <Select value={executiveId} onValueChange={setExecutiveId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {executives.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gerente de Projetos</Label>
              <Select value={managerId} onValueChange={setManagerId}>
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
