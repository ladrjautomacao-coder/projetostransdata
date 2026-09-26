import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenantBranding } from "@/contexts/TenantBrandingContext";
import { DEFAULT_STATUS_LABELS, applyStatusLabelOverrides } from "@/lib/statusLabels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { Plus } from "lucide-react";

interface ProjectType {
  id: string;
  name: string;
  short_code: string;
  active: boolean;
}

const STATUS_KEYS = Object.keys(DEFAULT_STATUS_LABELS) as (keyof typeof DEFAULT_STATUS_LABELS)[];

export default function ProjectTypes() {
  const { toast } = useToast();
  const branding = useTenantBranding();
  const isTransdata = branding.slug === "transdata";
  const [types, setTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [stageLabels, setStageLabels] = useState<Record<string, string>>({ ...DEFAULT_STATUS_LABELS });
  const [savingStages, setSavingStages] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("project_types").select("id, name, short_code, active").order("name");
    setTypes((data as any) || []);
    setLoading(false);
  };

  const loadStageLabels = async () => {
    const { data } = await (supabase as any).from("tenant_branding").select("status_labels").maybeSingle();
    setStageLabels({ ...DEFAULT_STATUS_LABELS, ...((data as any)?.status_labels || {}) });
  };

  useEffect(() => {
    load();
    if (!isTransdata) loadStageLabels();
  }, [isTransdata]);

  const saveStageLabels = async () => {
    setSavingStages(true);
    const { error } = await (supabase as any).from("tenant_branding").update({ status_labels: stageLabels });
    if (error) {
      toast({ title: "Erro ao salvar etapas", description: error.message, variant: "destructive" });
    } else {
      applyStatusLabelOverrides(stageLabels);
      toast({ title: "Etapas do Kanban atualizadas!" });
    }
    setSavingStages(false);
  };

  const resetForm = () => { setName(""); setShortCode(""); };

  const handleAdd = async () => {
    if (!name.trim() || !shortCode.trim()) {
      toast({ title: "Informe o nome e a sigla", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const code = shortCode.trim().toUpperCase();
    const { error } = await supabase.from("project_types").insert({
      name: name.trim(),
      code,
      short_code: code,
    });
    if (error) {
      toast({ title: "Erro ao criar tipo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tipo de projeto criado!" });
      resetForm();
      setOpen(false);
      load();
    }
    setSubmitting(false);
  };

  const toggleActive = async (t: ProjectType) => {
    await supabase.from("project_types").update({ active: !t.active }).eq("id", t.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tipos de Projeto</h1>
          <p className="text-sm text-muted-foreground">Usados no cadastro de projeto e no código gerado automaticamente.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Tipo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Tipo de Projeto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="Ex: Implantação" />
              </div>
              <div className="space-y-2">
                <Label>Sigla *</Label>
                <Input
                  value={shortCode}
                  onChange={e => setShortCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  placeholder="Ex: IMP"
                />
                <p className="text-xs text-muted-foreground">Aparece dentro do código automático do projeto.</p>
              </div>
              <Button onClick={handleAdd} disabled={submitting} className="w-full">
                {submitting ? "Criando..." : "Criar tipo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : types.length === 0 ? (
            <div className="py-12">
              <EmptyState
                type="projects"
                title="Nenhum tipo de projeto cadastrado"
                description="Crie o primeiro tipo pra liberar o cadastro de projetos."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Sigla</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.short_code}</TableCell>
                    <TableCell><Badge variant={t.active ? "default" : "secondary"}>{t.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(t)}>
                        {t.active ? "Desativar" : "Reativar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isTransdata && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Etapas do Kanban</CardTitle>
            <CardDescription>Renomeie as etapas pra linguagem do seu negócio. A ordem e a lógica continuam as mesmas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {STATUS_KEYS.map(key => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">{DEFAULT_STATUS_LABELS[key]}</Label>
                  <Input
                    value={stageLabels[key] ?? ""}
                    onChange={e => setStageLabels(s => ({ ...s, [key]: e.target.value }))}
                    maxLength={40}
                  />
                </div>
              ))}
            </div>
            <Button onClick={saveStageLabels} disabled={savingStages}>
              {savingStages ? "Salvando..." : "Salvar etapas"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
