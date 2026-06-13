
-- Soluções: desativar todas e (re)ativar/inserir a lista oficial
UPDATE public.solutions SET active = false;

INSERT INTO public.solutions (name, active) VALUES
  ('Bilhetagem', true),
  ('Its (legado)', true),
  ('Gestão de frota', true),
  ('Biometria facial', true),
  ('Carrier', true),
  ('Telemetria', true),
  ('ATM', true),
  ('Carteira Google', true),
  ('Pix por aproximação', true),
  ('AtlasMob', true)
ON CONFLICT (name) DO UPDATE SET active = true;

-- Catálogo de sub-características de soluções
CREATE TABLE public.solution_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (solution_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solution_features TO authenticated;
GRANT ALL ON public.solution_features TO service_role;

ALTER TABLE public.solution_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view solution features"
  ON public.solution_features FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage solution features"
  ON public.solution_features FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Junção projeto x feature selecionada
CREATE TABLE public.project_solution_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  solution_feature_id uuid NOT NULL REFERENCES public.solution_features(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, solution_feature_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_solution_features TO authenticated;
GRANT ALL ON public.project_solution_features TO service_role;

ALTER TABLE public.project_solution_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view project solution features"
  ON public.project_solution_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert project solution features"
  ON public.project_solution_features FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update project solution features"
  ON public.project_solution_features FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete project solution features"
  ON public.project_solution_features FOR DELETE TO authenticated USING (true);

-- Seed das 4 features do AtlasMob
INSERT INTO public.solution_features (solution_id, name, sort_order)
SELECT s.id, f.name, f.sort_order
FROM public.solutions s
CROSS JOIN (VALUES
  ('Personalizado', 1),
  ('Informativo ao usuário', 2),
  ('Cadastro e recadastro', 3),
  ('Carteira digital', 4)
) AS f(name, sort_order)
WHERE s.name = 'AtlasMob'
ON CONFLICT (solution_id, name) DO NOTHING;
