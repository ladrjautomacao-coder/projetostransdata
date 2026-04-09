
-- Create integrations table
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view integrations" ON public.integrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert integrations" ON public.integrations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update integrations" ON public.integrations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete integrations" ON public.integrations FOR DELETE TO authenticated USING (true);

-- Seed data
INSERT INTO public.integrations (name) VALUES
  ('CFTV - Plenatech'),
  ('Bilhetagem - TRANSDATA'),
  ('Monitoramento - Bus2');

-- Create project_integrations junction table
CREATE TABLE public.project_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  UNIQUE (project_id, integration_id)
);

ALTER TABLE public.project_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view project_integrations" ON public.project_integrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert project_integrations" ON public.project_integrations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete project_integrations" ON public.project_integrations FOR DELETE TO authenticated USING (true);
