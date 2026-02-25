import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Save } from "lucide-react";
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

  const [executives, setExecutives] = useState<{ id: string; full_name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from("team_members").select("id, full_name").eq("role", "executivo_vendas").eq("active", true).then(({ data }) => setExecutives(data || []));
    supabase.from("team_members").select("id, full_name").eq("role", "gerente_projetos").eq("active", true).then(({ data }) => setManagers(data || []));
    supabase.from("products").select("id, name").eq("active", true).then(({ data }) => setProducts(data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !city || !state || !contractDate) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
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
      }).select("id").single();
      if (error) throw error;

      if (selectedProducts.length > 0) {
        const rows = selectedProducts.map(pid => ({ project_id: project.id, product_id: pid }));
        await supabase.from("project_products").insert(rows);
      }

      await supabase.from("project_history").insert({
        project_id: project.id,
        change_type: "created",
        changed_by: user?.id || null,
        new_values: { company_name: companyName, city, state, status },
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

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/projetos")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      <h1 className="text-2xl font-bold mb-6">Cadastrar Novo Projeto</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Dados Gerais</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Nome da Empresa <span className="text-destructive">*</span></Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Cidade <span className="text-destructive">*</span></Label>
              <Input value={city} onChange={e => setCity(e.target.value)} required maxLength={100} />
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
            <DatePicker label="Data de Contratação" date={contractDate} onSelect={setContractDate} required />
            <DatePicker label="Data D-zero" date={dZeroDate} onSelect={setDZeroDate} />
            <DatePicker label="Data Handover" date={handoverDate} onSelect={setHandoverDate} />
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader><CardTitle className="text-lg">Comercial / Escopo</CardTitle></CardHeader>
          <CardContent>
            <Label className="mb-3 block">Produtos Contratados</Label>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto cadastrado. Cadastre produtos na área de administração.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {products.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedProducts.includes(p.id)}
                      onCheckedChange={checked => {
                        setSelectedProducts(prev => checked ? [...prev, p.id] : prev.filter(x => x !== p.id));
                      }}
                    />
                    <span className="text-sm">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
