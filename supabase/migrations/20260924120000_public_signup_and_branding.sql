-- Fase 7: bucket público para logos de cliente, e uma função pública (sem
-- exigir login) que resolve a marca de um tenant pelo slug — usada pela tela
-- de login/cadastro antes de qualquer autenticação existir.

INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public can read tenant logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-logos');

CREATE POLICY "super_admin manages tenant logos"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'tenant-logos' AND public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (bucket_id = 'tenant-logos' AND public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.get_public_tenant_branding(_slug text)
RETURNS TABLE (
  slug text,
  portal_name text,
  logo_url text,
  primary_color text,
  sidebar_color text,
  accent_color text,
  status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.slug, tb.portal_name, tb.logo_url, tb.primary_color, tb.sidebar_color,
         tb.accent_color, t.status
  FROM public.tenants t
  LEFT JOIN public.tenant_branding tb ON tb.tenant_id = t.id
  WHERE lower(t.slug) = lower(_slug)
$$;
REVOKE ALL ON FUNCTION public.get_public_tenant_branding(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tenant_branding(text) TO anon, authenticated;
