
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "Admins or linked manager can update projects" ON public.projects;

CREATE POLICY "Admins or linked manager can update projects"
ON public.projects
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR manager_id IN (SELECT tm.id FROM public.team_members tm WHERE tm.email = public.current_user_email())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR manager_id IN (SELECT tm.id FROM public.team_members tm WHERE tm.email = public.current_user_email())
);
