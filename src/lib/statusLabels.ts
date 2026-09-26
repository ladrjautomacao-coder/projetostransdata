import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

export const DEFAULT_STATUS_LABELS: Record<ProjectStatus, string> = {
  comercial: "Comercial",
  planejamento: "Planejamento",
  implantacao: "Implantação",
  encerrado: "Implementado",
  suspenso: "Outros",
};

// Objeto mutável e compartilhado: cada tenant só tem uma aba aberta por vez
// (SPA), então sobrescrever essas chaves quando a marca do tenant carrega
// (ver TenantBrandingContext) é seguro e evita precisar tocar em todo lugar
// que já importa e lê `statusLabels[status]`.
export const statusLabels: Record<ProjectStatus, string> = { ...DEFAULT_STATUS_LABELS };

export function applyStatusLabelOverrides(overrides: Partial<Record<ProjectStatus, string>> | null | undefined) {
  Object.assign(statusLabels, DEFAULT_STATUS_LABELS, overrides ?? {});
}
