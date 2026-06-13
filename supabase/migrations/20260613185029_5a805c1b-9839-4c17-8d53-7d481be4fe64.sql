
CREATE TABLE public.equipment_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.equipment_types TO authenticated;
GRANT ALL ON public.equipment_types TO service_role;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view equipment types" ON public.equipment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage equipment types" ON public.equipment_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.project_equipments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  equipment_type_id uuid NOT NULL REFERENCES public.equipment_types(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, equipment_type_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_equipments TO authenticated;
GRANT ALL ON public.project_equipments TO service_role;
ALTER TABLE public.project_equipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view project equipments" ON public.project_equipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert project equipments" ON public.project_equipments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update project equipments" ON public.project_equipments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete project equipments" ON public.project_equipments FOR DELETE TO authenticated USING (true);

INSERT INTO public.equipment_types (name, sort_order) VALUES
  ('AB STD', 10),
  ('AB FULL', 20),
  ('AB EMV', 30),
  ('AB QRC', 40),
  ('V6 STD', 50),
  ('V6 FULL', 60),
  ('V6 EMV', 70),
  ('V6 QRC', 80),
  ('V6 SECC', 90),
  ('V5', 100),
  ('V5 SECC', 110);
