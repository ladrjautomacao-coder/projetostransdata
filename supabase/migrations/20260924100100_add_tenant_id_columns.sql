-- Fase 1: coluna tenant_id, nula por ora, com DEFAULT apontando pro único
-- tenant existente (Transdata) — assim nenhum INSERT do app atual (que ainda
-- não sabe de tenants) quebra enquanto a Fase 2 (front-end) não é feita.
ALTER TABLE public.profiles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id)
  DEFAULT 'a2f1c8e0-0000-4000-8000-000000000001';
ALTER TABLE public.projects ADD COLUMN tenant_id uuid REFERENCES public.tenants(id)
  DEFAULT 'a2f1c8e0-0000-4000-8000-000000000001';
ALTER TABLE public.team_members ADD COLUMN tenant_id uuid REFERENCES public.tenants(id)
  DEFAULT 'a2f1c8e0-0000-4000-8000-000000000001';
ALTER TABLE public.products ADD COLUMN tenant_id uuid REFERENCES public.tenants(id)
  DEFAULT 'a2f1c8e0-0000-4000-8000-000000000001';
ALTER TABLE public.project_types ADD COLUMN tenant_id uuid REFERENCES public.tenants(id)
  DEFAULT 'a2f1c8e0-0000-4000-8000-000000000001';
ALTER TABLE public.solutions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id)
  DEFAULT 'a2f1c8e0-0000-4000-8000-000000000001';
ALTER TABLE public.solution_features ADD COLUMN tenant_id uuid REFERENCES public.tenants(id)
  DEFAULT 'a2f1c8e0-0000-4000-8000-000000000001';
ALTER TABLE public.integrations ADD COLUMN tenant_id uuid REFERENCES public.tenants(id)
  DEFAULT 'a2f1c8e0-0000-4000-8000-000000000001';
ALTER TABLE public.equipment_types ADD COLUMN tenant_id uuid REFERENCES public.tenants(id)
  DEFAULT 'a2f1c8e0-0000-4000-8000-000000000001';
