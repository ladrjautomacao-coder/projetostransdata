
DROP POLICY IF EXISTS "Authenticated can update projects" ON public.projects;

CREATE POLICY "Admins or linked manager can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR manager_id IN (
      SELECT tm.id FROM public.team_members tm
      WHERE tm.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR manager_id IN (
      SELECT tm.id FROM public.team_members tm
      WHERE tm.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
