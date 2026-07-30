CREATE OR REPLACE FUNCTION public.my_project_scope()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE((public.get_effective_permissions(auth.uid())->>'scope'), 'all')
$$;
REVOKE ALL ON FUNCTION public.my_project_scope() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_project_scope() TO authenticated;

DROP POLICY IF EXISTS "Users can view permitted projects" ON public.projects;
CREATE POLICY "Users can view permitted projects" ON public.projects
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'integration'::app_role)
  OR has_permission(auth.uid(), 'visao_comercial', 'view')
  OR (
    has_permission(auth.uid(), 'projects', 'view')
    AND (public.my_project_scope() <> 'own' OR manager_id = public.get_my_manager_id())
  )
);