
-- 1) Restrict projects UPDATE policy to authenticated
DROP POLICY IF EXISTS "Admins or linked manager can update projects" ON public.projects;
CREATE POLICY "Admins or linked manager can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (manager_id IN (SELECT tm.id FROM public.team_members tm WHERE tm.email = public.current_user_email()))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (manager_id IN (SELECT tm.id FROM public.team_members tm WHERE tm.email = public.current_user_email()))
);

-- 2) norm_text: set search_path
CREATE OR REPLACE FUNCTION public.norm_text(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT upper(translate(coalesce(p,''),
    'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN'));
$function$;

-- 3) Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon, grant only where needed
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;

REVOKE ALL ON FUNCTION public.preview_project_code(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_project_code(text, text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_get_team_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_team_emails() TO authenticated;

REVOKE ALL ON FUNCTION public.generate_project_code(text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resolve_city_code(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._compute_city_sigla(text, boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.projects_set_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.norm_text(text) FROM PUBLIC, anon;

-- 4) team_members: hide email column from non-admins
--    Column-level SELECT revoke on email; admins get email via admin_get_team_emails() SECURITY DEFINER RPC.
REVOKE SELECT (email) ON public.team_members FROM authenticated;
REVOKE SELECT (email) ON public.team_members FROM anon;

-- Helper for managers to look up their own team_member id without needing SELECT on email column
CREATE OR REPLACE FUNCTION public.get_my_manager_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tm.id
  FROM public.team_members tm
  WHERE tm.email = public.current_user_email()
    AND tm.role = 'gerente_projetos'
    AND tm.active = true
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_my_manager_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_manager_id() TO authenticated;

-- 5) Replace "always true" INSERT/UPDATE/DELETE policies on project child tables
--    with a real admin-or-linked-manager check.
CREATE OR REPLACE FUNCTION public.can_write_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.team_members tm ON tm.id = p.manager_id
        WHERE p.id = _project_id
          AND tm.email = public.current_user_email()
      )
$$;
REVOKE ALL ON FUNCTION public.can_write_project(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_write_project(uuid) TO authenticated;

-- projects INSERT policy: require signed-in AND admin-or-linked-manager assignment (or admin creating)
DROP POLICY IF EXISTS "Authenticated can insert projects" ON public.projects;
CREATE POLICY "Authenticated can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR created_by = auth.uid()
  )
);

-- project_integrations
DROP POLICY IF EXISTS "Authenticated can insert project_integrations" ON public.project_integrations;
CREATE POLICY "Authenticated can insert project_integrations"
ON public.project_integrations FOR INSERT
TO authenticated
WITH CHECK (public.can_write_project(project_id));

DROP POLICY IF EXISTS "Authenticated can delete project_integrations" ON public.project_integrations;
CREATE POLICY "Authenticated can delete project_integrations"
ON public.project_integrations FOR DELETE
TO authenticated
USING (public.can_write_project(project_id));

-- project_products
DROP POLICY IF EXISTS "Authenticated can insert project_products" ON public.project_products;
CREATE POLICY "Authenticated can insert project_products"
ON public.project_products FOR INSERT
TO authenticated
WITH CHECK (public.can_write_project(project_id));

DROP POLICY IF EXISTS "Authenticated can delete project_products" ON public.project_products;
CREATE POLICY "Authenticated can delete project_products"
ON public.project_products FOR DELETE
TO authenticated
USING (public.can_write_project(project_id));

-- project_solutions
DROP POLICY IF EXISTS "Authenticated can insert project_solutions" ON public.project_solutions;
CREATE POLICY "Authenticated can insert project_solutions"
ON public.project_solutions FOR INSERT
TO authenticated
WITH CHECK (public.can_write_project(project_id));

DROP POLICY IF EXISTS "Authenticated can delete project_solutions" ON public.project_solutions;
CREATE POLICY "Authenticated can delete project_solutions"
ON public.project_solutions FOR DELETE
TO authenticated
USING (public.can_write_project(project_id));

-- project_equipments
DROP POLICY IF EXISTS "Authenticated insert project equipments" ON public.project_equipments;
CREATE POLICY "Authenticated insert project equipments"
ON public.project_equipments FOR INSERT
TO authenticated
WITH CHECK (public.can_write_project(project_id));

DROP POLICY IF EXISTS "Authenticated update project equipments" ON public.project_equipments;
CREATE POLICY "Authenticated update project equipments"
ON public.project_equipments FOR UPDATE
TO authenticated
USING (public.can_write_project(project_id))
WITH CHECK (public.can_write_project(project_id));

DROP POLICY IF EXISTS "Authenticated delete project equipments" ON public.project_equipments;
CREATE POLICY "Authenticated delete project equipments"
ON public.project_equipments FOR DELETE
TO authenticated
USING (public.can_write_project(project_id));

-- project_solution_features
DROP POLICY IF EXISTS "Authenticated insert project solution features" ON public.project_solution_features;
CREATE POLICY "Authenticated insert project solution features"
ON public.project_solution_features FOR INSERT
TO authenticated
WITH CHECK (public.can_write_project(project_id));

DROP POLICY IF EXISTS "Authenticated update project solution features" ON public.project_solution_features;
CREATE POLICY "Authenticated update project solution features"
ON public.project_solution_features FOR UPDATE
TO authenticated
USING (public.can_write_project(project_id))
WITH CHECK (public.can_write_project(project_id));

DROP POLICY IF EXISTS "Authenticated delete project solution features" ON public.project_solution_features;
CREATE POLICY "Authenticated delete project solution features"
ON public.project_solution_features FOR DELETE
TO authenticated
USING (public.can_write_project(project_id));
