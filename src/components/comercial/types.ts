import type { Database } from "@/integrations/supabase/types";

export type ProjectStatus = Database["public"]["Enums"]["project_status"];

export interface FollowUpProject {
  id: string;
  company_name: string;
  project_code: string | null;
  city: string;
  state: string;
  status: ProjectStatus;
  sub_phase: string | null;
  contract_date: string;
  d_zero_date: string | null;
  handover_date: string | null;
  fleet_size: number | null;
  implemented_fleet: number;
  observations: string | null;
  is_pilot: boolean;
  created_at: string;
  updated_at: string;
  manager_id: string | null;
  executive: { full_name: string } | null;
  manager: { full_name: string } | null;
  project_solutions: { solution: { name: string } | null }[];
  project_integrations: { integration: { name: string } | null }[];
}
