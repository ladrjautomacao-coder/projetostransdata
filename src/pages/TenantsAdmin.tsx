import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  tenant_branding: { portal_name: string | null; primary_color: string | null } | null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function TenantsAdmin() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [portalName, setPortalName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [sidebarColor, setSidebarColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tenants")
      .select("id, name, slug, created_at, tenant_branding(portal_name, primary_color)")
      .order("created_at");
    setTenants((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName(""); setSlug(""); setPortalName("");
    setPrimaryColor(""); setSidebarColor(""); setAccentColor("");
    setAdminName(""); setAdminEmail("");
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim() || !adminEmail.trim()) {
      toast({ title: "Preencha nome do cliente, slug e e-mail do admin", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({ name: name.trim(), slug: slugify(slug) })
      .select("id")
      .single();

    if (tenantErr || !tenant) {
      toast({ title: "Erro ao criar cliente", description: tenantErr?.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error: brandingErr } = await supabase.from("tenant_branding").insert({
      tenant_id: tenant.id,
      portal_name: portalName.trim() || name.trim(),
      primary_color: primaryColor.trim() || null,
      sidebar_color: sidebarColor.trim() || null,
      accent_color: accentColor.trim() || null,
    });
    if (brandingErr) {
      toast({ title: "Cliente criado, mas houve erro na marca", description: brandingErr.message, variant: "destructive" });
    }

    const { data: session } = await supabase.auth.getSession();
    const { data: fnData, error: fnError } = await supabase.functions.invoke("admin-users?action=create", {
      body: {
        email: adminEmail.trim().toLowerCase(),
        full_name: adminName.trim() || adminEmail.trim(),
        role: "admin",
        tenant_id: tenant.id,
      },
    });
    void session;

    if (fnError || (fnData as any)?.error) {
      toast({
        title: "Cliente criado, mas houve erro ao criar o admin",
        description: fnError?.message || (fnData as any)?.error,
        variant: "destructive",
      });
    } else {
      toast({ title: "Cliente e admin criados!", description: "O admin usa \"esqueci minha senha\" no login para definir a senha." });
    }

    resetForm();
    setOpen(false);
    setSubmitting(false);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Empresas licenciadas, com dados e marca isolados.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cadastrar Cliente</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do cliente *</Label>
                <Input value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} maxLength={60} placeholder="ex: empresa-x" />
              </div>
              <div className="space-y-2">
                <Label>Nome do portal (aparece no menu)</Label>
                <Input value={portalName} onChange={e => setPortalName(e.target.value)} maxLength={100} placeholder={name || "ex: Portal Empresa X"} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Cor primária</Label>
                  <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="273 70% 32%" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Cor da barra lateral</Label>
                  <Input value={sidebarColor} onChange={e => setSidebarColor(e.target.value)} placeholder="273 70% 18%" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Cor de destaque</Label>
                  <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} placeholder="17 89% 54%" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Cores no formato HSL "H S% L%" (sem o "hsl()"). Deixe em branco para usar o padrão do sistema.
              </p>
              <hr />
              <div className="space-y-2">
                <Label>Nome do admin do cliente *</Label>
                <Input value={adminName} onChange={e => setAdminName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>E-mail do admin do cliente *</Label>
                <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} maxLength={200} />
              </div>
              <Button onClick={handleCreate} disabled={submitting} className="w-full">
                {submitting ? "Criando..." : "Criar cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : tenants.length === 0 ? (
        <EmptyState title="Nenhum cliente cadastrado" description="Cadastre o primeiro cliente licenciado." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Nome do portal</TableHead>
                  <TableHead>Cor primária</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                    <TableCell className="text-muted-foreground">{t.tenant_branding?.portal_name || "—"}</TableCell>
                    <TableCell>
                      {t.tenant_branding?.primary_color ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: `hsl(${t.tenant_branding.primary_color})` }}
                          />
                          {t.tenant_branding.primary_color}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
