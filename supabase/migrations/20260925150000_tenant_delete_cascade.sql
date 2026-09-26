-- Permite excluir um tenant de verdade: as tabelas que referenciam
-- tenant_id hoje bloqueiam a exclusão (ON DELETE NO ACTION, o padrão).
-- Passam a cascatear — projects já cascateia pras 9 tabelas dependentes,
-- e profiles/user_roles já cascateiam a partir de auth.users (apagado
-- separadamente pela edge function, via Admin API).
ALTER TABLE public.profiles DROP CONSTRAINT profiles_tenant_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.projects DROP CONSTRAINT projects_tenant_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.team_members DROP CONSTRAINT team_members_tenant_id_fkey;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.products DROP CONSTRAINT products_tenant_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.project_types DROP CONSTRAINT project_types_tenant_id_fkey;
ALTER TABLE public.project_types ADD CONSTRAINT project_types_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.solutions DROP CONSTRAINT solutions_tenant_id_fkey;
ALTER TABLE public.solutions ADD CONSTRAINT solutions_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.solution_features DROP CONSTRAINT solution_features_tenant_id_fkey;
ALTER TABLE public.solution_features ADD CONSTRAINT solution_features_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.integrations DROP CONSTRAINT integrations_tenant_id_fkey;
ALTER TABLE public.integrations ADD CONSTRAINT integrations_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.equipment_types DROP CONSTRAINT equipment_types_tenant_id_fkey;
ALTER TABLE public.equipment_types ADD CONSTRAINT equipment_types_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
