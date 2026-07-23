CREATE POLICY "Integration can read team_members"
ON public.team_members
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'integration'::app_role));