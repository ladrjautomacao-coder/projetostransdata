import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AttachmentCategory { value: string; label: string }
export interface TeamRole { value: string; label: string }

export interface AppSettings {
  // SLA Kanban (em dias)
  slaGreenMaxDays: number;
  slaYellowMaxDays: number;
  slaOrangeMaxDays: number;
  // Alertas
  dzeroWindowDays: number;
  stuckDays: number;
  pollingSeconds: number;
  // Storage
  previewUrlTtl: number;
  downloadUrlTtl: number;
  // Validações
  companyNameMax: number;
  cityMax: number;
  pilotInfoMax: number;
  kanbanNoteMax: number;
  // Catálogos
  attachmentCategories: AttachmentCategory[];
  teamRoles: TeamRole[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  slaGreenMaxDays: 7,
  slaYellowMaxDays: 15,
  slaOrangeMaxDays: 30,
  dzeroWindowDays: 7,
  stuckDays: 30,
  pollingSeconds: 60,
  previewUrlTtl: 60,
  downloadUrlTtl: 300,
  companyNameMax: 200,
  cityMax: 100,
  pilotInfoMax: 2000,
  kanbanNoteMax: 500,
  attachmentCategories: [
    { value: "contrato", label: "Contrato" },
    { value: "proposta", label: "Proposta Comercial" },
    { value: "ata", label: "Ata de Reunião" },
    { value: "outros", label: "Demais Documentos" },
  ],
  teamRoles: [
    { value: "executivo_vendas", label: "Executivo de Vendas" },
    { value: "gerente_projetos", label: "Gerente de Projetos" },
  ],
};

const KEY_MAP: Record<string, keyof AppSettings> = {
  "sla.kanban.green_max_days": "slaGreenMaxDays",
  "sla.kanban.yellow_max_days": "slaYellowMaxDays",
  "sla.kanban.orange_max_days": "slaOrangeMaxDays",
  "alerts.dzero_window_days": "dzeroWindowDays",
  "alerts.stuck_days": "stuckDays",
  "alerts.polling_seconds": "pollingSeconds",
  "storage.preview_url_ttl_seconds": "previewUrlTtl",
  "storage.download_url_ttl_seconds": "downloadUrlTtl",
  "validation.company_name_max": "companyNameMax",
  "validation.city_max": "cityMax",
  "validation.pilot_info_max": "pilotInfoMax",
  "validation.kanban_note_max": "kanbanNoteMax",
  "attachment.categories": "attachmentCategories",
  "team.roles": "teamRoles",
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  reload: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await (supabase as any).from("app_settings").select("key, value");
    if (data) {
      const merged: AppSettings = { ...DEFAULT_SETTINGS };
      for (const row of data as Array<{ key: string; value: any }>) {
        const field = KEY_MAP[row.key];
        if (field) (merged as any)[field] = row.value;
      }
      setSettings(merged);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SettingsContext.Provider value={{ settings, loading, reload: load }}>
      {children}
    </SettingsContext.Provider>
  );
}
