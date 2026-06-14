import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export default function TeamMembers() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const roleLabels = Object.fromEntries(settings.teamRoles.map(r => [r.value, r.label]));
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(settings.teamRoles[0]?.value || "executivo_vendas");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("team_members").select("*").eq("active", true).order("full_name");
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!name.trim()) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("team_members").insert({ full_name: name.trim(), email: email.trim() || null, role });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Membro adicionado!" }); setName(""); setEmail(""); setOpen(false); load(); }
    setSubmitting(false);
  };

  const handleDeactivate = async (id: string) => {
    await supabase.from("team_members").update({ active: false }).eq("id", id);
    toast({ title: "Membro desativado" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Equipe</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Membro</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Membro</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome Completo *</Label><Input value={name} onChange={e => setName(e.target.value)} maxLength={100} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={255} /></div>
              <div className="space-y-2">
                <Label>Função *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {settings.teamRoles.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={submitting} className="w-full">{submitting ? "Salvando..." : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : members.length === 0 ? (
        <EmptyState type="team" title="Nenhum membro cadastrado" description="Adicione membros da equipe para começar a gerenciar seus projetos." />
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name}</TableCell>
                  <TableCell>{m.email || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{roleLabels[m.role] || m.role}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeactivate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
