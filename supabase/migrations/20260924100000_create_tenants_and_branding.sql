-- Fase 1 da conversão multi-tenant: tabelas de tenant e marca (white-label).
-- Políticas que dependem de get_my_tenant_id() só entram na migration D,
-- depois que a coluna profiles.tenant_id existir.
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX tenants_slug_uq ON public.tenants (lower(slug));
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

CREATE TABLE public.tenant_branding (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  portal_name text,
  logo_url text,
  primary_color text,
  sidebar_color text,
  accent_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tenant_branding TO authenticated;
GRANT ALL ON public.tenant_branding TO service_role;

-- Único tenant hoje: a própria Transdata. UUID literal fixo para as próximas
-- migrations desta mesma rodada referenciarem deterministicamente.
INSERT INTO public.tenants (id, name, slug) VALUES
  ('a2f1c8e0-0000-4000-8000-000000000001', 'Transdata', 'transdata');

INSERT INTO public.tenant_branding (tenant_id, portal_name, primary_color, sidebar_color, accent_color) VALUES
  ('a2f1c8e0-0000-4000-8000-000000000001', 'GP Transdata', '273 70% 32%', '273 70% 18%', '17 89% 54%');

CREATE POLICY "super_admin manages tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin manages tenant_branding" ON public.tenant_branding
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
