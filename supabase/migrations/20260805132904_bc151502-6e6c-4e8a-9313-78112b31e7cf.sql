-- 1. Revoke direct execution of internal SECURITY DEFINER code-generation functions
REVOKE ALL ON FUNCTION public.generate_project_code(text,text,uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.preview_project_code(text,text,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_project_code(text,text,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.preview_project_code(text,text,uuid,text,text) TO service_role;

-- 2. Harden manager identification: unique email per team member, ambiguous matches ignored
CREATE UNIQUE INDEX IF NOT EXISTS team_members_email_lower_uniq
  ON public.team_members (lower(email)) WHERE email IS NOT NULL;

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
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  v_email := lower(public.current_user_email());
  IF v_email IS NULL OR v_email = '' THEN RETURN NULL; END IF;

  SELECT count(*) INTO v_count
  FROM public.team_members tm
  WHERE lower(tm.email) = v_email
    AND tm.role = 'gerente_projetos'
    AND tm.active = true;

  IF v_count <> 1 THEN RETURN NULL; END IF;

  SELECT tm.id INTO v_id
  FROM public.team_members tm
  WHERE lower(tm.email) = v_email
    AND tm.role = 'gerente_projetos'
    AND tm.active = true;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_manager_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_manager_id() TO authenticated, service_role;

-- 3. project_history is append-only via trigger: read-only for clients
REVOKE INSERT, UPDATE, DELETE ON public.project_history FROM anon, authenticated;
GRANT SELECT ON public.project_history TO authenticated;
GRANT ALL ON public.project_history TO service_role;

DROP POLICY IF EXISTS "No manual history inserts" ON public.project_history;
CREATE POLICY "No manual history inserts"
  ON public.project_history AS RESTRICTIVE FOR INSERT
  TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "No manual history updates" ON public.project_history;
CREATE POLICY "No manual history updates"
  ON public.project_history AS RESTRICTIVE FOR UPDATE
  TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No manual history deletes" ON public.project_history;
CREATE POLICY "No manual history deletes"
  ON public.project_history AS RESTRICTIVE FOR DELETE
  TO anon, authenticated USING (false);