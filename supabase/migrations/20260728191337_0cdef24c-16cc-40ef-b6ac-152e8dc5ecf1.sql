
CREATE OR REPLACE FUNCTION public.log_project_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_old jsonb;
  v_new jsonb;
  v_diff_old jsonb := '{}'::jsonb;
  v_diff_new jsonb := '{}'::jsonb;
  v_key text;
  v_change_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.project_history(project_id, changed_by, change_type, old_values, new_values)
    VALUES (NEW.id, v_actor, 'created', NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.project_history(project_id, changed_by, change_type, old_values, new_values)
    VALUES (OLD.id, v_actor, 'deleted', to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
      IF v_key IN ('updated_at') THEN CONTINUE; END IF;
      IF (v_old->v_key) IS DISTINCT FROM (v_new->v_key) THEN
        v_diff_old := v_diff_old || jsonb_build_object(v_key, v_old->v_key);
        v_diff_new := v_diff_new || jsonb_build_object(v_key, v_new->v_key);
      END IF;
    END LOOP;
    IF v_diff_new = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
    v_change_type := CASE WHEN v_diff_new ? 'status' THEN 'status_change' ELSE 'updated' END;
    INSERT INTO public.project_history(project_id, changed_by, change_type, old_values, new_values)
    VALUES (NEW.id, v_actor, v_change_type, v_diff_old, v_diff_new);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_audit ON public.projects;
CREATE TRIGGER trg_projects_audit
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.log_project_change();

REVOKE EXECUTE ON FUNCTION public.log_project_change() FROM PUBLIC, anon, authenticated;
