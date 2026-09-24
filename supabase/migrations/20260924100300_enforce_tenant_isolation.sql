-- Fase 1 (etapa final): trava as colunas, reescreve as funções de segurança
-- para respeitar tenant (com super_admin como papel cross-tenant, plataforma),
-- e adiciona as políticas RESTRICTIVE que isolam cada tenant dos demais.

-- 1) Travar NOT NULL agora que todo dado está preenchido (via DEFAULT + backfill).
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.projects ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.team_members ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.project_types ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.solutions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.solution_features ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.integrations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.equipment_types ALTER COLUMN tenant_id SET NOT NULL;

-- 2) Índices únicos que eram globais passam a ser por tenant.
DROP INDEX IF EXISTS public.team_members_email_lower_uniq;
CREATE UNIQUE INDEX team_members_tenant_email_lower_uniq
  ON public.team_members (tenant_id, lower(email)) WHERE email IS NOT NULL;

ALTER TABLE public.project_types DROP CONSTRAINT IF EXISTS project_types_name_key;
CREATE UNIQUE INDEX project_types_tenant_name_uq ON public.project_types (tenant_id, name);
DROP INDEX IF EXISTS public.project_types_code_uq;
CREATE UNIQUE INDEX project_types_tenant_code_uq ON public.project_types (tenant_id, code);

ALTER TABLE public.solutions DROP CONSTRAINT IF EXISTS solutions_name_key;
CREATE UNIQUE INDEX solutions_tenant_name_uq ON public.solutions (tenant_id, name);

ALTER TABLE public.equipment_types DROP CONSTRAINT IF EXISTS equipment_types_name_key;
CREATE UNIQUE INDEX equipment_types_tenant_name_uq ON public.equipment_types (tenant_id, name);

DROP INDEX IF EXISTS public.projects_project_code_uq;
CREATE UNIQUE INDEX projects_tenant_project_code_uq ON public.projects (tenant_id, project_code);

-- 3) Funções novas: identidade de tenant do usuário logado, e um helper
--    reaproveitado em todas as políticas RESTRICTIVE abaixo.
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() $$;
REVOKE ALL ON FUNCTION public.get_my_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.tenant_guard(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _tenant_id IS NOT NULL
    AND (_tenant_id = public.get_my_tenant_id() OR public.has_role(auth.uid(), 'super_admin'))
$$;
REVOKE ALL ON FUNCTION public.tenant_guard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tenant_guard(uuid) TO authenticated, service_role;

-- 4) can_view_project / can_write_project: checagem de tenant primeiro,
--    com bypass só para super_admin (papel de operador da plataforma).
CREATE OR REPLACE FUNCTION public.can_view_project(_project_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_scope text;
  v_mgr uuid;
  v_project_tenant uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF public.has_role(auth.uid(),'super_admin') THEN RETURN true; END IF;

  SELECT tenant_id INTO v_project_tenant FROM public.projects WHERE id = _project_id;
  IF v_project_tenant IS NULL OR v_project_tenant IS DISTINCT FROM public.get_my_tenant_id() THEN
    RETURN false;
  END IF;

  IF public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'integration') THEN
    RETURN true;
  END IF;
  IF public.has_permission(auth.uid(),'visao_comercial','view') THEN
    RETURN true;
  END IF;
  IF NOT public.has_permission(auth.uid(),'projects','view') THEN
    RETURN false;
  END IF;
  v_scope := public.get_user_scope(auth.uid());
  IF v_scope <> 'own' THEN RETURN true; END IF;
  v_mgr := public.get_my_manager_id();
  IF v_mgr IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.manager_id = v_mgr);
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_write_project(_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_scope text;
  v_is_owner boolean;
  v_project_tenant uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF public.has_role(auth.uid(),'super_admin') THEN RETURN true; END IF;

  SELECT tenant_id INTO v_project_tenant FROM public.projects WHERE id = _project_id;
  IF v_project_tenant IS NULL OR v_project_tenant IS DISTINCT FROM public.get_my_tenant_id() THEN
    RETURN false;
  END IF;

  IF public.has_role(auth.uid(),'admin') THEN RETURN true; END IF;
  IF NOT public.has_permission(auth.uid(),'projects','edit') THEN
    RETURN false;
  END IF;
  v_scope := public.get_user_scope(auth.uid());
  IF v_scope = 'all' THEN RETURN true; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.team_members tm ON tm.id = p.manager_id
    WHERE p.id = _project_id AND tm.email = public.current_user_email()
  ) INTO v_is_owner;
  RETURN COALESCE(v_is_owner,false);
END;
$$;

-- 5) get_my_manager_id: mesma busca de antes, restrita ao tenant do usuário
--    (evita colisão de e-mail entre colaboradores de tenants diferentes).
CREATE OR REPLACE FUNCTION public.get_my_manager_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_id uuid;
  v_count int;
  v_tenant uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  v_email := lower(public.current_user_email());
  IF v_email IS NULL OR v_email = '' THEN RETURN NULL; END IF;
  v_tenant := public.get_my_tenant_id();
  IF v_tenant IS NULL THEN RETURN NULL; END IF;

  SELECT count(*) INTO v_count
  FROM public.team_members tm
  WHERE lower(tm.email) = v_email
    AND tm.role = 'gerente_projetos'
    AND tm.active = true
    AND tm.tenant_id = v_tenant;

  IF v_count <> 1 THEN RETURN NULL; END IF;

  SELECT tm.id INTO v_id
  FROM public.team_members tm
  WHERE lower(tm.email) = v_email
    AND tm.role = 'gerente_projetos'
    AND tm.active = true
    AND tm.tenant_id = v_tenant;

  RETURN v_id;
END;
$$;

-- 6) get_effective_permissions: admin só pode inspecionar permissão de
--    usuário do mesmo tenant; super_admin continua irrestrito.
CREATE OR REPLACE FUNCTION public.get_effective_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role public.app_role;
  v_preset jsonb := '{}'::jsonb;
  v_override jsonb := '{}'::jsonb;
  v_allowed boolean;
BEGIN
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() THEN
    IF public.has_role(auth.uid(),'super_admin') THEN
      v_allowed := true;
    ELSIF public.has_role(auth.uid(),'admin') THEN
      SELECT EXISTS (
        SELECT 1 FROM public.profiles me, public.profiles target
        WHERE me.user_id = auth.uid() AND target.user_id = _user_id
          AND me.tenant_id = target.tenant_id
      ) INTO v_allowed;
    ELSE
      v_allowed := false;
    END IF;
    IF NOT v_allowed THEN RETURN '{}'::jsonb; END IF;
  END IF;
  v_role := public.get_primary_role(_user_id);
  IF v_role IS NULL THEN RETURN '{}'::jsonb; END IF;
  SELECT permissions INTO v_preset FROM public.role_presets WHERE role = v_role;
  SELECT permissions INTO v_override FROM public.user_permission_overrides WHERE user_id = _user_id;
  RETURN COALESCE(v_preset,'{}'::jsonb) || COALESCE(v_override,'{}'::jsonb);
END;
$$;

-- 7) handle_new_user: novo usuário nasce no tenant indicado pelo admin que o
--    criou (Fase 3 vai passar isso via metadata do Admin API); sem indicação,
--    cai no único tenant de hoje (Transdata).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, cargo, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'cargo',
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, 'a2f1c8e0-0000-4000-8000-000000000001')
  )
  ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 8) role_presets é global (mesmos papéis/permissões-padrão para todos os
--    tenants) — editar isso não pode mais ser feito por um admin de tenant,
--    só pelo operador da plataforma (super_admin).
DROP POLICY IF EXISTS "admins insert presets" ON public.role_presets;
CREATE POLICY "super_admin insert presets" ON public.role_presets
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "admins update presets" ON public.role_presets;
CREATE POLICY "super_admin update presets" ON public.role_presets
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- 9) Políticas RESTRICTIVE (o Postgres combina com E, nunca com OU — nenhuma
--    política permissiva existente ou futura consegue abrir brecha nisso).
--    9a) Tabelas com tenant_id direto.
CREATE POLICY "tenant guard" ON public.profiles AS RESTRICTIVE FOR ALL USING (public.tenant_guard(tenant_id));
CREATE POLICY "tenant guard" ON public.projects AS RESTRICTIVE FOR ALL USING (public.tenant_guard(tenant_id));
CREATE POLICY "tenant guard" ON public.team_members AS RESTRICTIVE FOR ALL USING (public.tenant_guard(tenant_id));
CREATE POLICY "tenant guard" ON public.products AS RESTRICTIVE FOR ALL USING (public.tenant_guard(tenant_id));
CREATE POLICY "tenant guard" ON public.project_types AS RESTRICTIVE FOR ALL USING (public.tenant_guard(tenant_id));
CREATE POLICY "tenant guard" ON public.solutions AS RESTRICTIVE FOR ALL USING (public.tenant_guard(tenant_id));
CREATE POLICY "tenant guard" ON public.solution_features AS RESTRICTIVE FOR ALL USING (public.tenant_guard(tenant_id));
CREATE POLICY "tenant guard" ON public.integrations AS RESTRICTIVE FOR ALL USING (public.tenant_guard(tenant_id));
CREATE POLICY "tenant guard" ON public.equipment_types AS RESTRICTIVE FOR ALL USING (public.tenant_guard(tenant_id));

--    9b) Tabelas dependentes de projects, isoladas via project_id -> projects.tenant_id.
CREATE POLICY "tenant guard" ON public.project_notes AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_notes.project_id AND public.tenant_guard(p.tenant_id)));
CREATE POLICY "tenant guard" ON public.project_attachments AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_attachments.project_id AND public.tenant_guard(p.tenant_id)));
CREATE POLICY "tenant guard" ON public.project_history AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_history.project_id AND public.tenant_guard(p.tenant_id)));
CREATE POLICY "tenant guard" ON public.project_products AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_products.project_id AND public.tenant_guard(p.tenant_id)));
CREATE POLICY "tenant guard" ON public.project_solutions AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_solutions.project_id AND public.tenant_guard(p.tenant_id)));
CREATE POLICY "tenant guard" ON public.project_integrations AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_integrations.project_id AND public.tenant_guard(p.tenant_id)));
CREATE POLICY "tenant guard" ON public.project_equipments AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_equipments.project_id AND public.tenant_guard(p.tenant_id)));
CREATE POLICY "tenant guard" ON public.project_solution_features AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_solution_features.project_id AND public.tenant_guard(p.tenant_id)));
CREATE POLICY "tenant guard" ON public.report_imp_files AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = report_imp_files.project_id AND public.tenant_guard(p.tenant_id)));
CREATE POLICY "tenant guard" ON public.project_note_history AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_note_history.project_id AND public.tenant_guard(p.tenant_id)));

--    9c) Tabelas por usuário, isoladas via user_id -> profiles.tenant_id.
CREATE POLICY "tenant guard" ON public.user_roles AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.user_id = user_roles.user_id AND public.tenant_guard(pr.tenant_id)));
CREATE POLICY "tenant guard" ON public.user_permission_overrides AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.user_id = user_permission_overrides.user_id AND public.tenant_guard(pr.tenant_id)));

-- 10) Agora que get_my_tenant_id existe, liberar leitura da própria marca/tenant.
CREATE POLICY "authenticated can read own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = public.get_my_tenant_id() OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "authenticated can read own tenant_branding" ON public.tenant_branding
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_my_tenant_id() OR public.has_role(auth.uid(), 'super_admin'));
