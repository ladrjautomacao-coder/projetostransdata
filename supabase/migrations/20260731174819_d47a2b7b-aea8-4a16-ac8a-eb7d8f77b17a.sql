-- 1. project_history: restrict SELECT to viewable projects
DROP POLICY IF EXISTS "Authenticated can view history" ON public.project_history;
CREATE POLICY "View history of visible projects"
ON public.project_history FOR SELECT TO authenticated
USING (public.can_view_project(project_id));

-- 2. project sub-tables: scope SELECT to visible projects
DROP POLICY IF EXISTS "Authenticated can view project notes" ON public.project_notes;
CREATE POLICY "View notes of visible projects"
ON public.project_notes FOR SELECT TO authenticated
USING (public.can_view_project(project_id));

DROP POLICY IF EXISTS "Authenticated view project equipments" ON public.project_equipments;
CREATE POLICY "View equipments of visible projects"
ON public.project_equipments FOR SELECT TO authenticated
USING (public.can_view_project(project_id));

DROP POLICY IF EXISTS "Authenticated can view project_solutions" ON public.project_solutions;
CREATE POLICY "View solutions of visible projects"
ON public.project_solutions FOR SELECT TO authenticated
USING (public.can_view_project(project_id));

DROP POLICY IF EXISTS "Authenticated can view project_products" ON public.project_products;
CREATE POLICY "View products of visible projects"
ON public.project_products FOR SELECT TO authenticated
USING (public.can_view_project(project_id));

DROP POLICY IF EXISTS "Authenticated can view project_integrations" ON public.project_integrations;
CREATE POLICY "View integrations of visible projects"
ON public.project_integrations FOR SELECT TO authenticated
USING (public.can_view_project(project_id));

DROP POLICY IF EXISTS "Authenticated view project solution features" ON public.project_solution_features;
CREATE POLICY "View solution features of visible projects"
ON public.project_solution_features FOR SELECT TO authenticated
USING (public.can_view_project(project_id));

-- 3. Revoke direct execution of internal SECURITY DEFINER helpers not called by the app
REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_project_scope() FROM authenticated, anon, PUBLIC;