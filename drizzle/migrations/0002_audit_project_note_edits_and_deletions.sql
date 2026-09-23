ALTER TABLE public.project_notes
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE public.project_note_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL,
  project_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('updated', 'deleted')),
  old_content text NOT NULL,
  new_content text,
  note_created_by uuid,
  changed_by uuid,
  changed_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.project_note_history TO authenticated;
GRANT ALL ON public.project_note_history TO service_role;

ALTER TABLE public.project_note_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View note history of visible projects"
ON public.project_note_history
FOR SELECT
TO authenticated
USING (public.can_view_project(project_id));

CREATE INDEX idx_project_note_history_project_changed
  ON public.project_note_history (project_id, changed_at DESC);

CREATE INDEX idx_project_note_history_note
  ON public.project_note_history (note_id, changed_at DESC);

CREATE OR REPLACE FUNCTION public.audit_project_note_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.project_id IS DISTINCT FROM OLD.project_id
       OR NEW.created_by IS DISTINCT FROM OLD.created_by
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Não é permitido alterar o projeto, autor ou data original do acompanhamento';
    END IF;

    IF NEW.content IS DISTINCT FROM OLD.content THEN
      INSERT INTO public.project_note_history (
        note_id, project_id, action, old_content, new_content,
        note_created_by, changed_by, changed_at
      ) VALUES (
        OLD.id, OLD.project_id, 'updated', OLD.content, NEW.content,
        OLD.created_by, auth.uid(), now()
      );
      NEW.updated_at := now();
    ELSE
      NEW.updated_at := OLD.updated_at;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.project_note_history (
      note_id, project_id, action, old_content, new_content,
      note_created_by, changed_by, changed_at
    ) VALUES (
      OLD.id, OLD.project_id, 'deleted', OLD.content, NULL,
      OLD.created_by, auth.uid(), now()
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_project_note_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_project_note_change() FROM anon;
REVOKE ALL ON FUNCTION public.audit_project_note_change() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.audit_project_note_change() TO service_role;

CREATE TRIGGER trg_project_notes_audit
BEFORE UPDATE OR DELETE ON public.project_notes
FOR EACH ROW
EXECUTE FUNCTION public.audit_project_note_change();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_notes TO authenticated;
GRANT ALL ON public.project_notes TO service_role;

ALTER POLICY "Authors or admins can update project notes"
ON public.project_notes
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

ALTER POLICY "Authors or admins can delete project notes"
ON public.project_notes
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);