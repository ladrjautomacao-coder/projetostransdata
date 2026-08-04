DROP POLICY IF EXISTS "Admins or linked manager can update projects" ON public.projects;
CREATE POLICY "Admins or linked manager can update projects"
ON public.projects FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR (manager_id IS NOT NULL AND manager_id = public.get_my_manager_id()))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR (manager_id IS NOT NULL AND manager_id = public.get_my_manager_id()));