
-- 1. Helper: who can view a project
CREATE OR REPLACE FUNCTION public.can_view_project(_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_scope text;
  v_mgr uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
     OR public.has_role(auth.uid(),'integration') THEN
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
$$;
REVOKE ALL ON FUNCTION public.can_view_project(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_project(uuid) TO authenticated, service_role;

-- 2. projects: scoped SELECT
DROP POLICY IF EXISTS "Authenticated can view projects" ON public.projects;
CREATE POLICY "Users can view permitted projects"
ON public.projects FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'integration')
  OR (
    public.has_permission(auth.uid(),'projects','view')
    AND (
      public.get_user_scope(auth.uid()) <> 'own'
      OR manager_id = public.get_my_manager_id()
    )
  )
);

-- 3. project_attachments: scoped SELECT
DROP POLICY IF EXISTS "Authenticated can view attachments" ON public.project_attachments;
CREATE POLICY "Users can view attachments of permitted projects"
ON public.project_attachments FOR SELECT TO authenticated
USING (public.can_view_project(project_id));

-- 4. storage: scope file reads to the attachment's project
DROP POLICY IF EXISTS "Authenticated can view project-attachments" ON storage.objects;
CREATE POLICY "Scoped read of project-attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-attachments'
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_attachments pa
      WHERE pa.file_path = storage.objects.name
        AND public.can_view_project(pa.project_id)
    )
  )
);

-- 5. team_members: enforce column-level revoke of email for authenticated
REVOKE SELECT ON public.team_members FROM authenticated;
REVOKE ALL ON public.team_members FROM anon;
GRANT SELECT (id, full_name, role, active, created_at) ON public.team_members TO authenticated;

-- 6. SECURITY DEFINER exposure: lock down helper functions not needed by clients
REVOKE ALL ON FUNCTION public.get_primary_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_scope(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_scope(uuid) TO service_role;

-- get_effective_permissions: only self or admins
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
BEGIN
  IF auth.uid() IS NOT NULL
     AND _user_id <> auth.uid()
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RETURN '{}'::jsonb;
  END IF;
  v_role := public.get_primary_role(_user_id);
  IF v_role IS NULL THEN RETURN '{}'::jsonb; END IF;
  SELECT permissions INTO v_preset FROM public.role_presets WHERE role = v_role;
  SELECT permissions INTO v_override FROM public.user_permission_overrides WHERE user_id = _user_id;
  RETURN COALESCE(v_preset,'{}'::jsonb) || COALESCE(v_override,'{}'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.get_effective_permissions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_effective_permissions(uuid) TO authenticated, service_role;
