
-- Read-only policies for 'integration' role across operational tables
CREATE POLICY "integration read projects" ON public.projects
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read project_notes" ON public.project_notes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read project_equipments" ON public.project_equipments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read project_solutions" ON public.project_solutions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read project_solution_features" ON public.project_solution_features
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read project_integrations" ON public.project_integrations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read project_products" ON public.project_products
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read project_types" ON public.project_types
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read equipment_types" ON public.equipment_types
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read solutions" ON public.solutions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read solution_features" ON public.solution_features
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read integrations" ON public.integrations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read products" ON public.products
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read city_codes" ON public.city_codes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read team_members" ON public.team_members
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));

CREATE POLICY "integration read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'integration'));
