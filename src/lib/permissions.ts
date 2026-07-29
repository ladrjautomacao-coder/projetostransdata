export const MODULES = [
  { key: "dashboard", label: "Dashboard", actions: ["view"] as const },
  { key: "projects", label: "Gestão de Projetos", actions: ["view", "create", "edit", "delete", "move_card"] as const },
  { key: "implantacao", label: "Implantação", actions: ["view"] as const },
  { key: "financeiro", label: "Financeiro", actions: ["view"] as const },
  { key: "admin_team", label: "Admin — Equipe", actions: ["view", "edit"] as const },
  { key: "admin_users", label: "Admin — Usuários", actions: ["view", "edit"] as const },
  { key: "admin_settings", label: "Admin — Configurações", actions: ["view", "edit"] as const },
  { key: "admin_manual", label: "Manual do Sistema", actions: ["view"] as const },
] as const;

export const SECTIONS = [
  { key: "identificacao", label: "Identificação" },
  { key: "datas", label: "Datas" },
  { key: "frota", label: "Frota" },
  { key: "solucoes", label: "Soluções / Escopo" },
  { key: "equipamentos", label: "Equipamentos" },
  { key: "integracoes", label: "Integrações" },
  { key: "acompanhamento", label: "Acompanhamento" },
  { key: "anexos", label: "Anexos" },
  { key: "status_kanban", label: "Status / Kanban" },
] as const;

export const ACTION_LABELS: Record<string, string> = {
  view: "Ver",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir",
  move_card: "Mover Card",
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  gerente_projetos: "Gerente de Projetos",
  executivo: "Executivo",
  comercial: "Comercial",
  user: "Usuário (legado)",
  leitor: "Leitor",
  integration: "Integração (API)",
};

export const AVAILABLE_ROLES = [
  "super_admin", "admin", "gerente_projetos", "executivo", "comercial", "leitor", "user", "integration",
] as const;

export type PermModule = typeof MODULES[number]["key"];
export type PermAction = "view" | "create" | "edit" | "delete" | "move_card";
export type PermSection = typeof SECTIONS[number]["key"];

export interface PermissionsShape {
  scope?: "all" | "own";
  modules?: Partial<Record<PermModule, Partial<Record<PermAction, boolean>>>>;
  sections?: Partial<Record<PermSection, boolean>>;
}

export function checkPerm(
  perms: PermissionsShape | null | undefined,
  module: PermModule,
  action: PermAction,
  section?: PermSection,
  isAdmin = false
): boolean {
  if (isAdmin) return true;
  if (!perms?.modules) return false;
  const mod = perms.modules[module];
  if (!mod) return false;
  const val = mod[action];
  if (!val) return false;
  if (section && action === "edit" && module === "projects") {
    const s = perms.sections?.[section];
    return s !== false;
  }
  return true;
}
