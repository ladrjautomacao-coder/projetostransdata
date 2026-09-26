-- Atividades/etapas dentro de um projeto — base do Cronograma (Gantt).
-- Teste controlado: por enquanto só a tela do tenant "empresateste" usa isso
-- no front-end, mas a tabela/RLS já nasce correta pra qualquer tenant, no
-- mesmo padrão de isolamento de project_notes/project_attachments.
CREATE TABLE public.project_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  responsible_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada','em_andamento','concluida')),
  percent_complete integer NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_activities_dates_chk CHECK (end_date >= start_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_activities TO authenticated;
GRANT ALL ON public.project_activities TO service_role;

ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

-- Mesmo desenho de project_notes: leitura ampla dentro do tenant, escrita
-- pelo autor ou admin. A RESTRICTIVE "tenant guard" abaixo garante que
-- nunca atravessa tenant, independente destas.
CREATE POLICY "Authenticated can view project activities"
  ON public.project_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create project activities"
  ON public.project_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authors or admins can update project activities"
  ON public.project_activities FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors or admins can delete project activities"
  ON public.project_activities FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "tenant guard" ON public.project_activities AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_activities.project_id AND public.tenant_guard(p.tenant_id)));

CREATE INDEX idx_project_activities_project_id ON public.project_activities(project_id, start_date);

CREATE TRIGGER trg_project_activities_updated_at BEFORE UPDATE ON public.project_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
