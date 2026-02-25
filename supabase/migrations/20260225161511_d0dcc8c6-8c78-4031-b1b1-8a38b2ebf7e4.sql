
-- Table: project_types (configurable list)
CREATE TABLE public.project_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view project_types" ON public.project_types FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert project_types" ON public.project_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update project_types" ON public.project_types FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete project_types" ON public.project_types FOR DELETE USING (true);

-- Seed initial project types
INSERT INTO public.project_types (name) VALUES ('Serviço'), ('Locação'), ('Venda');

-- Table: solutions (configurable list)
CREATE TABLE public.solutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view solutions" ON public.solutions FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert solutions" ON public.solutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update solutions" ON public.solutions FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete solutions" ON public.solutions FOR DELETE USING (true);

-- Seed initial solutions
INSERT INTO public.solutions (name) VALUES ('Fretamento'), ('Telemetria'), ('Rastreamento');

-- Junction table: project_solutions (many-to-many)
CREATE TABLE public.project_solutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  solution_id UUID NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
  UNIQUE(project_id, solution_id)
);
ALTER TABLE public.project_solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view project_solutions" ON public.project_solutions FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert project_solutions" ON public.project_solutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can delete project_solutions" ON public.project_solutions FOR DELETE USING (true);

-- New columns on projects
ALTER TABLE public.projects
  ADD COLUMN project_type_id UUID REFERENCES public.project_types(id),
  ADD COLUMN fleet_size INTEGER,
  ADD COLUMN implementation_deadline_days INTEGER,
  ADD COLUMN contractual_deadline_days INTEGER,
  ADD COLUMN is_pilot BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN pilot_info TEXT,
  ADD COLUMN filled_by UUID;
