
-- 2) Tabela de presets por papel
CREATE TABLE IF NOT EXISTS public.role_presets (
  role public.app_role PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_presets TO authenticated;
GRANT ALL ON public.role_presets TO service_role;

ALTER TABLE public.role_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users read presets" ON public.role_presets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins insert presets" ON public.role_presets
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "admins update presets" ON public.role_presets
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "super admins delete presets" ON public.role_presets
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));

-- 3) Tabela de overrides por usuário
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permission_overrides TO authenticated;
GRANT ALL ON public.user_permission_overrides TO service_role;

ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own or admin" ON public.user_permission_overrides
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
  );
CREATE POLICY "admins insert overrides" ON public.user_permission_overrides
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "admins update overrides" ON public.user_permission_overrides
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "admins delete overrides" ON public.user_permission_overrides
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- 4) Função: pega papel principal do usuário
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'gerente_projetos' THEN 3
    WHEN 'executivo' THEN 4
    WHEN 'comercial' THEN 5
    WHEN 'user' THEN 6
    WHEN 'leitor' THEN 7
    WHEN 'integration' THEN 8
    ELSE 99
  END
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_primary_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO authenticated, service_role;

-- 5) Função: permissões efetivas (merge preset + override)
CREATE OR REPLACE FUNCTION public.get_effective_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_preset jsonb := '{}'::jsonb;
  v_override jsonb := '{}'::jsonb;
BEGIN
  v_role := public.get_primary_role(_user_id);
  IF v_role IS NULL THEN RETURN '{}'::jsonb; END IF;
  SELECT permissions INTO v_preset FROM public.role_presets WHERE role = v_role;
  SELECT permissions INTO v_override FROM public.user_permission_overrides WHERE user_id = _user_id;
  RETURN COALESCE(v_preset,'{}'::jsonb) || COALESCE(v_override,'{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_effective_permissions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_effective_permissions(uuid) TO authenticated, service_role;

-- 6) Função: verifica permissão (module, action, section opcional)
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text, _action text, _section text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_perms jsonb;
  v_mod jsonb;
  v_action_val jsonb;
  v_sections jsonb;
BEGIN
  IF public.has_role(_user_id,'super_admin') OR public.has_role(_user_id,'admin') THEN
    RETURN true;
  END IF;
  v_perms := public.get_effective_permissions(_user_id);
  v_mod := v_perms->'modules'->_module;
  IF v_mod IS NULL THEN RETURN false; END IF;
  v_action_val := v_mod->_action;
  IF v_action_val IS NULL OR v_action_val = 'false'::jsonb THEN RETURN false; END IF;
  IF _section IS NOT NULL AND _action = 'edit' AND _module = 'projects' THEN
    v_sections := v_perms->'sections';
    IF v_sections IS NULL THEN RETURN true; END IF;
    IF (v_sections->_section) IS NULL THEN RETURN true; END IF;
    RETURN (v_sections->_section)::boolean;
  END IF;
  RETURN v_action_val::boolean;
END;
$$;

REVOKE ALL ON FUNCTION public.has_permission(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid,text,text,text) TO authenticated, service_role;

-- 7) Função: escopo do usuário
CREATE OR REPLACE FUNCTION public.get_user_scope(_user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((public.get_effective_permissions(_user_id)->>'scope'), 'all')
$$;

REVOKE ALL ON FUNCTION public.get_user_scope(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_scope(uuid) TO authenticated, service_role;

-- 8) Atualiza can_write_project para respeitar permissão
CREATE OR REPLACE FUNCTION public.can_write_project(_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_scope text;
  v_is_owner boolean;
BEGIN
  IF public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') THEN
    RETURN true;
  END IF;
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

-- 9) Trigger updated_at
DROP TRIGGER IF EXISTS trg_role_presets_upd ON public.role_presets;
CREATE TRIGGER trg_role_presets_upd BEFORE UPDATE ON public.role_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_user_perm_ovr_upd ON public.user_permission_overrides;
CREATE TRIGGER trg_user_perm_ovr_upd BEFORE UPDATE ON public.user_permission_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 10) Seed dos presets
INSERT INTO public.role_presets(role, permissions) VALUES
('super_admin', '{
  "scope":"all",
  "modules":{
    "dashboard":{"view":true},
    "projects":{"view":true,"create":true,"edit":true,"delete":true,"move_card":true},
    "implantacao":{"view":true},
    "admin_team":{"view":true,"edit":true},
    "admin_users":{"view":true,"edit":true},
    "admin_settings":{"view":true,"edit":true},
    "admin_manual":{"view":true}
  },
  "sections":{"identificacao":true,"datas":true,"frota":true,"solucoes":true,"equipamentos":true,"integracoes":true,"acompanhamento":true,"anexos":true,"status_kanban":true}
}'::jsonb),
('admin', '{
  "scope":"all",
  "modules":{
    "dashboard":{"view":true},
    "projects":{"view":true,"create":true,"edit":true,"delete":true,"move_card":true},
    "implantacao":{"view":true},
    "admin_team":{"view":true,"edit":true},
    "admin_users":{"view":true,"edit":true},
    "admin_settings":{"view":true,"edit":true},
    "admin_manual":{"view":true}
  },
  "sections":{"identificacao":true,"datas":true,"frota":true,"solucoes":true,"equipamentos":true,"integracoes":true,"acompanhamento":true,"anexos":true,"status_kanban":true}
}'::jsonb),
('gerente_projetos', '{
  "scope":"own",
  "modules":{
    "dashboard":{"view":true},
    "projects":{"view":true,"create":false,"edit":true,"delete":false,"move_card":true},
    "implantacao":{"view":true},
    "admin_team":{"view":false},"admin_users":{"view":false},"admin_settings":{"view":false},
    "admin_manual":{"view":true}
  },
  "sections":{"identificacao":true,"datas":true,"frota":true,"solucoes":true,"equipamentos":true,"integracoes":true,"acompanhamento":true,"anexos":true,"status_kanban":true}
}'::jsonb),
('executivo', '{
  "scope":"all",
  "modules":{
    "dashboard":{"view":true},
    "projects":{"view":true,"create":true,"edit":true,"delete":false,"move_card":false},
    "implantacao":{"view":true},
    "admin_team":{"view":false},"admin_users":{"view":false},"admin_settings":{"view":false},
    "admin_manual":{"view":true}
  },
  "sections":{"identificacao":true,"datas":false,"frota":true,"solucoes":true,"equipamentos":false,"integracoes":false,"acompanhamento":true,"anexos":true,"status_kanban":false}
}'::jsonb),
('comercial', '{
  "scope":"all",
  "modules":{
    "dashboard":{"view":true},
    "projects":{"view":true,"create":true,"edit":true,"delete":false,"move_card":false},
    "implantacao":{"view":false},
    "admin_team":{"view":false},"admin_users":{"view":false},"admin_settings":{"view":false},
    "admin_manual":{"view":true}
  },
  "sections":{"identificacao":true,"datas":false,"frota":true,"solucoes":true,"equipamentos":false,"integracoes":false,"acompanhamento":true,"anexos":true,"status_kanban":false}
}'::jsonb),
('leitor', '{
  "scope":"all",
  "modules":{
    "dashboard":{"view":true},
    "projects":{"view":true,"create":false,"edit":false,"delete":false,"move_card":false},
    "implantacao":{"view":true},
    "admin_team":{"view":false},"admin_users":{"view":false},"admin_settings":{"view":false},
    "admin_manual":{"view":true}
  },
  "sections":{}
}'::jsonb),
('user', '{
  "scope":"all",
  "modules":{
    "dashboard":{"view":true},
    "projects":{"view":true,"create":false,"edit":false,"delete":false,"move_card":false},
    "implantacao":{"view":true},
    "admin_team":{"view":false},"admin_users":{"view":false},"admin_settings":{"view":false},
    "admin_manual":{"view":true}
  },
  "sections":{}
}'::jsonb),
('integration', '{
  "scope":"all",
  "modules":{
    "dashboard":{"view":false},
    "projects":{"view":true,"create":false,"edit":false,"delete":false,"move_card":false},
    "implantacao":{"view":false},
    "admin_team":{"view":false},"admin_users":{"view":false},"admin_settings":{"view":false},
    "admin_manual":{"view":false}
  },
  "sections":{}
}'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions, updated_at = now();
