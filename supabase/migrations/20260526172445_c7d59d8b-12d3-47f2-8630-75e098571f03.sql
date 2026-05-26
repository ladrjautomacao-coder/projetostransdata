
-- Tighten RLS: restrict public-role policies to authenticated and admins
-- project_solutions: drop public-role policies, recreate for authenticated
DROP POLICY IF EXISTS "Authenticated can delete project_solutions" ON public.project_solutions;
DROP POLICY IF EXISTS "Authenticated can insert project_solutions" ON public.project_solutions;
DROP POLICY IF EXISTS "Authenticated can view project_solutions" ON public.project_solutions;

CREATE POLICY "Authenticated can view project_solutions"
  ON public.project_solutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert project_solutions"
  ON public.project_solutions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete project_solutions"
  ON public.project_solutions FOR DELETE TO authenticated USING (true);

-- project_types: read for authenticated; writes admin-only
DROP POLICY IF EXISTS "Authenticated can delete project_types" ON public.project_types;
DROP POLICY IF EXISTS "Authenticated can insert project_types" ON public.project_types;
DROP POLICY IF EXISTS "Authenticated can update project_types" ON public.project_types;
DROP POLICY IF EXISTS "Authenticated can view project_types" ON public.project_types;

CREATE POLICY "Authenticated can view project_types"
  ON public.project_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert project_types"
  ON public.project_types FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update project_types"
  ON public.project_types FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete project_types"
  ON public.project_types FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- solutions: read for authenticated; writes admin-only
DROP POLICY IF EXISTS "Authenticated can delete solutions" ON public.solutions;
DROP POLICY IF EXISTS "Authenticated can insert solutions" ON public.solutions;
DROP POLICY IF EXISTS "Authenticated can update solutions" ON public.solutions;
DROP POLICY IF EXISTS "Authenticated can view solutions" ON public.solutions;

CREATE POLICY "Authenticated can view solutions"
  ON public.solutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert solutions"
  ON public.solutions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update solutions"
  ON public.solutions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete solutions"
  ON public.solutions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- team_members: writes admin-only (keep read for authenticated)
DROP POLICY IF EXISTS "Authenticated can delete team" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can insert team" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can update team" ON public.team_members;

CREATE POLICY "Admins can insert team"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update team"
  ON public.team_members FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete team"
  ON public.team_members FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: split ALL into explicit per-command policies (admin only)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage: project-attachments bucket — ownership-aware writes
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual ILIKE '%project-attachments%' OR with_check ILIKE '%project-attachments%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated can view project-attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-attachments');

CREATE POLICY "Authenticated can upload project-attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-attachments' AND owner = auth.uid());

CREATE POLICY "Owners or admins can update project-attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-attachments'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Owners or admins can delete project-attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-attachments'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

-- Revoke EXECUTE on SECURITY DEFINER functions from public roles
-- has_role is referenced inside RLS policies (runs in policy context regardless of grants)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
