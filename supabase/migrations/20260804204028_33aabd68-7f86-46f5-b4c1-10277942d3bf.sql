-- 1. sigla de 2 letras por tipo
ALTER TABLE public.project_types ADD COLUMN IF NOT EXISTS short_code text;

UPDATE public.project_types SET short_code = CASE code
  WHEN 'VEQ' THEN 'VE'
  WHEN 'ASG' THEN 'AS'
  WHEN 'ATD' THEN 'AT'
  ELSE upper(substr(regexp_replace(code,'[^A-Za-z0-9]','','g'),1,2))
END
WHERE short_code IS NULL;

-- garantir unicidade das siglas (ajusta duplicadas legadas)
DO $$
DECLARE r record; c text; i int;
BEGIN
  FOR r IN
    SELECT id, short_code FROM public.project_types t1
    WHERE EXISTS (
      SELECT 1 FROM public.project_types t2
      WHERE t2.short_code = t1.short_code AND t2.id <> t1.id AND t2.ctid < t1.ctid
    )
  LOOP
    i := 0;
    LOOP
      i := i + 1;
      c := substr(r.short_code,1,1) || substr('0123456789', ((i-1) % 10) + 1, 1);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.project_types WHERE short_code = c);
      EXIT WHEN i > 50;
    END LOOP;
    UPDATE public.project_types SET short_code = c WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.project_types ALTER COLUMN short_code SET NOT NULL;

-- 2. helper de normalização
CREATE OR REPLACE FUNCTION public.code_token(p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT regexp_replace(public.norm_text(coalesce(p,'')), '[^A-Z0-9]', '', 'g');
$$;

-- 3. sequência global
CREATE SEQUENCE IF NOT EXISTS public.projects_code_seq_v2 START WITH 1;

-- 4. mapa de seguimento
CREATE OR REPLACE FUNCTION public.segment_code(p_segment text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT CASE p_segment
    WHEN 'new_project' THEN 'NEW'
    WHEN 'upgrade_equipamentos' THEN 'UPG'
    ELSE '___'
  END;
$$;

-- 5. geração e prévia
DROP FUNCTION IF EXISTS public.generate_project_code(text, text, uuid);
DROP FUNCTION IF EXISTS public.preview_project_code(text, text, uuid);

CREATE OR REPLACE FUNCTION public.generate_project_code(
  p_city text, p_state text, p_project_type_id uuid, p_segment text, p_company_name text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_type text; v_seq bigint;
BEGIN
  SELECT short_code INTO v_type FROM project_types WHERE id = p_project_type_id;
  IF v_type IS NULL THEN RAISE EXCEPTION 'Tipo de projeto inválido'; END IF;
  v_seq := nextval('public.projects_code_seq_v2');
  RETURN substr(public.code_token(p_city),1,3)
      || upper(coalesce(p_state,''))
      || upper(v_type)
      || public.segment_code(p_segment)
      || lpad(v_seq::text, 4, '0')
      || '-' || public.code_token(p_company_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.preview_project_code(
  p_city text, p_state text, p_project_type_id uuid, p_segment text, p_company_name text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_type text;
BEGIN
  SELECT short_code INTO v_type FROM project_types WHERE id = p_project_type_id;
  IF v_type IS NULL THEN RETURN NULL; END IF;
  RETURN substr(public.code_token(p_city),1,3)
      || upper(coalesce(p_state,''))
      || upper(v_type)
      || public.segment_code(p_segment)
      || '····'
      || '-' || public.code_token(p_company_name);
END;
$$;

REVOKE ALL ON FUNCTION public.generate_project_code(text,text,uuid,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.preview_project_code(text,text,uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_project_code(text,text,uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_project_code(text,text,uuid,text,text) TO authenticated, service_role;

-- 6. trigger
CREATE OR REPLACE FUNCTION public.projects_set_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    IF NEW.project_type_id IS NULL THEN
      RAISE EXCEPTION 'project_type_id é obrigatório para gerar o código do projeto';
    END IF;
    NEW.project_code := public.generate_project_code(
      NEW.city, NEW.state::text, NEW.project_type_id, NEW.project_segment, NEW.company_name
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 7. backfill dos projetos existentes
DO $$
DECLARE r record; v_type text; v_i bigint := 0;
BEGIN
  FOR r IN SELECT id, city, state, project_type_id, project_segment, company_name
           FROM public.projects ORDER BY created_at ASC
  LOOP
    v_i := v_i + 1;
    SELECT short_code INTO v_type FROM public.project_types WHERE id = r.project_type_id;
    UPDATE public.projects SET project_code =
      substr(public.code_token(r.city),1,3)
      || upper(r.state::text)
      || upper(coalesce(v_type,'XX'))
      || public.segment_code(r.project_segment)
      || lpad(v_i::text,4,'0')
      || '-' || public.code_token(r.company_name)
    WHERE id = r.id;
  END LOOP;
  PERFORM setval('public.projects_code_seq_v2', GREATEST(v_i,1), v_i > 0);
END $$;