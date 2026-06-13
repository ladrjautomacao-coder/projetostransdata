
-- Tighten RLS on integrations: admin-only mutations
DROP POLICY IF EXISTS "Authenticated can delete integrations" ON public.integrations;
DROP POLICY IF EXISTS "Authenticated can insert integrations" ON public.integrations;
DROP POLICY IF EXISTS "Authenticated can update integrations" ON public.integrations;
CREATE POLICY "Admins can delete integrations" ON public.integrations FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins can insert integrations" ON public.integrations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins can update integrations" ON public.integrations FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Tighten RLS on products: admin-only mutations
DROP POLICY IF EXISTS "Authenticated can delete products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- project_attachments: restrict DELETE to uploader or admin
DROP POLICY IF EXISTS "Authenticated can delete attachments" ON public.project_attachments;
CREATE POLICY "Uploader or admins can delete attachments" ON public.project_attachments
  FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by OR has_role(auth.uid(),'admin'::app_role));

-- project_attachments: ensure INSERT records the uploader
DROP POLICY IF EXISTS "Authenticated can insert attachments" ON public.project_attachments;
CREATE POLICY "Authenticated can insert own attachments" ON public.project_attachments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- project_history: prevent direct INSERT by users (write via triggers/service_role only)
DROP POLICY IF EXISTS "Authenticated can insert history" ON public.project_history;
-- (no replacement INSERT policy => denied for authenticated; service_role bypasses RLS)

-- projects: restrict DELETE to admins
DROP POLICY IF EXISTS "Authenticated can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

-- team_members: hide email column from non-admins via column-level grants.
-- Replace broad SELECT with admin SELECT + a restricted SELECT for everyone, then
-- revoke email column from authenticated/anon.
DROP POLICY IF EXISTS "Authenticated can view team" ON public.team_members;
CREATE POLICY "Authenticated can view team (non-email)" ON public.team_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can view team full" ON public.team_members
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

REVOKE SELECT ON public.team_members FROM anon, authenticated;
GRANT SELECT (id, full_name, role, active, created_at) ON public.team_members TO authenticated;
GRANT SELECT (id, full_name, role, active, created_at, email) ON public.team_members TO service_role;
-- Admins can still read email by querying through service_role (edge functions) or
-- via a dedicated RPC. We also expose a secure helper for client admin reads:
CREATE OR REPLACE FUNCTION public.admin_get_team_emails()
RETURNS TABLE(id uuid, full_name text, email text, role text, active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.full_name, t.email, t.role, t.active
  FROM public.team_members t
  WHERE has_role(auth.uid(),'admin'::app_role);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_team_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_team_emails() TO authenticated;

-- Restrict EXECUTE on internal trigger function (not meant to be called via API)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
