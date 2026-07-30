import { useEffect, useState, useCallback, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Save, RotateCcw, Search, User as UserIcon, ShieldCheck, ShieldOff } from "lucide-react";
import {
  MODULES, MODULE_GROUPS, ALL_ACTIONS, SECTIONS, ACTION_LABELS, ROLE_LABELS, AVAILABLE_ROLES,
  PermissionsShape, PermModule, PermAction, PermSection,
} from "@/lib/permissions";

interface Preset { role: string; permissions: PermissionsShape; }
interface UserRow { user_id: string; full_name: string; email: string; role: string; }

function PermissionMatrix({
  perms, onChange, disabled = false,
}: { perms: PermissionsShape; onChange: (p: PermissionsShape) => void; disabled?: boolean }) {
  const isOn = (m: PermModule, a: PermAction) => !!perms.modules?.[m]?.[a];

  const setMany = (entries: Array<[PermModule, PermAction]>, value: boolean) => {
    if (disabled) return;
    const modules: PermissionsShape["modules"] = { ...(perms.modules || {}) };
    for (const [m, a] of entries) modules[m] = { ...(modules[m] || {}), [a]: value };
    onChange({ ...perms, modules });
  };

  const toggle = (m: PermModule, a: PermAction) => setMany([[m, a]], !isOn(m, a));

  const modulePairs = (m: typeof MODULES[number]) =>
    (m.actions as readonly PermAction[]).map(a => [m.key, a] as [PermModule, PermAction]);

  const actionPairs = (a: PermAction) =>
    MODULES.filter(m => (m.actions as readonly string[]).includes(a))
      .map(m => [m.key, a] as [PermModule, PermAction]);

  const allPairs = MODULES.flatMap(modulePairs);
  const allOn = (pairs: Array<[PermModule, PermAction]>) => pairs.length > 0 && pairs.every(([m, a]) => isOn(m, a));

  const grantedCount = allPairs.filter(([m, a]) => isOn(m, a)).length;

  const toggleSection = (section: PermSection) => {
    if (disabled) return;
    const next: PermissionsShape = { ...perms, sections: { ...(perms.sections || {}) } };
    next.sections![section] = next.sections![section] === false ? true : false;
    onChange(next);
  };
  const setAllSections = (value: boolean) => {
    if (disabled) return;
    const sections: PermissionsShape["sections"] = {};
    for (const s of SECTIONS) sections[s.key] = value;
    onChange({ ...perms, sections });
  };
  const setScope = (val: "all" | "own") => {
    if (disabled) return;
    onChange({ ...perms, scope: val });
  };

  const canEditProjects = isOn("projects", "edit");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">Escopo de dados dos projetos:</span>
        <Select value={perms.scope || "all"} onValueChange={v => setScope(v as any)} disabled={disabled}>
          <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            <SelectItem value="own">Somente projetos vinculados</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="ml-auto">
          {grantedCount} de {allPairs.length} permissões ativas
        </Badge>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h4 className="text-sm font-semibold">Matriz de permissões — módulo × ação</h4>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setMany(allPairs, true)}>
              <ShieldCheck className="h-4 w-4 mr-1.5" /> Marcar tudo
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setMany(allPairs, false)}>
              <ShieldOff className="h-4 w-4 mr-1.5" /> Limpar tudo
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium min-w-[220px]">Módulo</th>
                {ALL_ACTIONS.map(a => (
                  <th key={a} className="text-center px-3 py-2 font-medium whitespace-nowrap">
                    <div>{ACTION_LABELS[a]}</div>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setMany(actionPairs(a), !allOn(actionPairs(a)))}
                      className="text-[10px] text-primary hover:underline disabled:opacity-50"
                    >
                      {allOn(actionPairs(a)) ? "desmarcar" : "marcar"} coluna
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULE_GROUPS.map(g => {
                const mods = MODULES.filter(m => m.group === g.key);
                if (!mods.length) return null;
                const groupPairs = mods.flatMap(modulePairs);
                return (
                  <Fragment key={g.key}>
                    <tr className="border-t bg-muted/30">
                      <td className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {g.label}
                      </td>
                      <td colSpan={ALL_ACTIONS.length} className="px-3 py-1.5 text-right">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => setMany(groupPairs, !allOn(groupPairs))}
                          className="text-[10px] text-primary hover:underline disabled:opacity-50"
                        >
                          {allOn(groupPairs) ? "desmarcar grupo" : "marcar grupo"}
                        </button>
                      </td>
                    </tr>
                    {mods.map(m => (
                      <tr key={m.key} className="border-t hover:bg-muted/20">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setMany(modulePairs(m), !allOn(modulePairs(m)))}
                            className="text-left hover:text-primary disabled:hover:text-foreground"
                            title="Marcar/desmarcar todas as ações deste módulo"
                          >
                            {m.label}
                          </button>
                        </td>
                        {ALL_ACTIONS.map(a => {
                          const supported = (m.actions as readonly string[]).includes(a);
                          return (
                            <td key={a} className="text-center px-3 py-2">
                              {supported ? (
                                <Checkbox checked={isOn(m.key, a)} onCheckedChange={() => toggle(m.key, a)} disabled={disabled} />
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h4 className="text-sm font-semibold">
            Seções editáveis dos projetos
            {!canEditProjects && (
              <span className="ml-2 text-xs font-normal text-amber-600">
                (ative "Editar" em Gestão de Projetos para valer)
              </span>
            )}
          </h4>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setAllSections(true)}>Marcar todas</Button>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setAllSections(false)}>Limpar todas</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-lg p-4">
          {SECTIONS.map(s => (
            <label key={s.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={perms.sections?.[s.key] !== false}
                onCheckedChange={() => toggleSection(s.key)}
                disabled={disabled}
              />
              {s.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Marcado = pode editar essa seção. Desmarcado = apenas leitura, mesmo se "Editar" estiver ativo.
        </p>
      </div>
    </div>
  );
}


export default function PermissionsAdmin() {
  const { toast } = useToast();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("projetos");
  const [rolePerms, setRolePerms] = useState<PermissionsShape>({});
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [overrides, setOverrides] = useState<Record<string, PermissionsShape>>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPerms, setUserPerms] = useState<PermissionsShape>({});
  const [userSearch, setUserSearch] = useState("");

  const load = useCallback(async () => {
    const [{ data: presetsData }, { data: overridesData }, { data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("role_presets").select("role, permissions"),
      supabase.from("user_permission_overrides").select("user_id, permissions"),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const list = (presetsData || []) as Preset[];
    setPresets(list);
    const current = list.find(p => p.role === selectedRole);
    setRolePerms(current?.permissions || {});

    const ovMap: Record<string, PermissionsShape> = {};
    for (const o of overridesData || []) ovMap[(o as any).user_id] = (o as any).permissions || {};
    setOverrides(ovMap);

    // Fetch emails via edge fn (admin only)
    const { data: userList } = await supabase.functions.invoke("admin-users?action=list");
    const emailMap = new Map<string, string>((userList || []).map((u: any) => [u.id as string, (u.email as string) || ""]));
    const roleMap = new Map<string, string>();
    for (const r of roles || []) roleMap.set((r as any).user_id, (r as any).role);
    const rows: UserRow[] = (profiles || []).map((p: any) => ({
      user_id: p.user_id as string,
      full_name: (p.full_name as string) || "—",
      email: emailMap.get(p.user_id) || "",
      role: roleMap.get(p.user_id) || "user",
    }));
    setUsers(rows);
  }, [selectedRole]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const p = presets.find(x => x.role === selectedRole);
    setRolePerms(p?.permissions || {});
  }, [selectedRole, presets]);

  useEffect(() => {
    if (!selectedUser) return;
    setUserPerms(overrides[selectedUser] || {});
  }, [selectedUser, overrides]);

  const savePreset = async () => {
    setSaving(true);
    const { error } = await supabase.from("role_presets")
      .update({ permissions: rolePerms as any }).eq("role", selectedRole as any);
    setSaving(false);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Papel atualizado", description: `Permissões de ${ROLE_LABELS[selectedRole]} salvas.` });
    load();
  };

  const saveOverride = async () => {
    if (!selectedUser) return;
    setSaving(true);
    const { error } = await supabase.from("user_permission_overrides")
      .upsert({ user_id: selectedUser, permissions: userPerms as any });
    setSaving(false);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Override aplicado", description: "Permissões personalizadas do usuário salvas." });
    load();
  };

  const clearOverride = async () => {
    if (!selectedUser) return;
    setSaving(true);
    const { error } = await supabase.from("user_permission_overrides").delete().eq("user_id", selectedUser);
    setSaving(false);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Override removido", description: "Usuário voltou às permissões padrão do papel." });
    load();
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const selectedUserObj = users.find(u => u.user_id === selectedUser);
  const basePresetForUser = selectedUserObj
    ? presets.find(p => p.role === selectedUserObj.role)?.permissions || {}
    : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-primary" />
          Permissões do Sistema
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure permissões por papel e sobrescreva por usuário quando necessário.
        </p>
      </div>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Papéis</TabsTrigger>
          <TabsTrigger value="users">Usuários (overrides)</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Papel:</CardTitle>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={savePreset} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> Salvar papel
              </Button>
            </CardHeader>
            <CardContent>
              <PermissionMatrix perms={rolePerms} onChange={setRolePerms} />
              {selectedRole === "admin" || selectedRole === "super_admin" ? (
                <p className="text-xs text-amber-600 mt-4">
                  ⚠ Admin e Super Admin têm acesso total garantido no backend independente destas configurações.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selecionar usuário</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." className="pl-9" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[520px] overflow-y-auto">
                {filteredUsers.map(u => (
                  <button
                    key={u.user_id}
                    onClick={() => setSelectedUser(u.user_id)}
                    className={`w-full text-left px-4 py-2.5 border-t hover:bg-muted/50 transition ${selectedUser === u.user_id ? "bg-primary/10" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">{u.full_name}</span>
                      {overrides[u.user_id] && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-semibold">CUSTOM</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{ROLE_LABELS[u.role] || u.role}</div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">
                  {selectedUserObj ? `Override: ${selectedUserObj.full_name}` : "Selecione um usuário"}
                </CardTitle>
                {selectedUser && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setUserPerms(basePresetForUser)}>
                      <RotateCcw className="h-4 w-4 mr-2" /> Copiar do papel
                    </Button>
                    {overrides[selectedUser] && (
                      <Button variant="outline" size="sm" onClick={clearOverride} disabled={saving}>
                        Remover override
                      </Button>
                    )}
                    <Button size="sm" onClick={saveOverride} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" /> Salvar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <PermissionMatrix perms={userPerms} onChange={setUserPerms} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">Escolha um usuário à esquerda para personalizar suas permissões.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
