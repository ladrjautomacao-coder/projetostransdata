CREATE OR REPLACE FUNCTION public.projects_set_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_seq text; v_type text; v_region text;
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    IF NEW.project_type_id IS NULL THEN
      RAISE EXCEPTION 'project_type_id é obrigatório para gerar o código do projeto';
    END IF;
    NEW.project_code := public.generate_project_code(
      NEW.city, NEW.state::text, NEW.project_type_id, NEW.project_segment, NEW.company_name, NEW.country_code
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.project_type_id IS NOT NULL AND (
      NEW.city IS DISTINCT FROM OLD.city
      OR NEW.state IS DISTINCT FROM OLD.state
      OR NEW.country_code IS DISTINCT FROM OLD.country_code
      OR NEW.project_type_id IS DISTINCT FROM OLD.project_type_id
      OR NEW.project_segment IS DISTINCT FROM OLD.project_segment
      OR NEW.company_name IS DISTINCT FROM OLD.company_name
    ) AND NEW.project_code = OLD.project_code THEN

    -- preserva o sequencial de 4 dígitos do código atual
    v_seq := substring(split_part(OLD.project_code, '-', 1) from '([0-9]{4})$');
    IF v_seq IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT short_code INTO v_type FROM project_types WHERE id = NEW.project_type_id;
    IF v_type IS NULL THEN RETURN NEW; END IF;

    v_region := CASE WHEN upper(coalesce(NEW.country_code,'BR')) = 'BR'
                     THEN upper(coalesce(NEW.state::text,''))
                     ELSE upper(coalesce(NEW.country_code,'')) END;

    NEW.project_code := substr(public.code_token(NEW.city),1,3)
      || v_region
      || upper(v_type)
      || public.segment_code(NEW.project_segment)
      || v_seq
      || '-' || public.code_token(NEW.company_name);
  END IF;

  RETURN NEW;
END;
$$;