
CREATE EXTENSION IF NOT EXISTS unaccent;

-- helper imutável de normalização (apenas upper + remoção de acentos via mapeamento)
CREATE OR REPLACE FUNCTION public.norm_text(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT upper(translate(coalesce(p,''),
    'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN'));
$$;

-- 1) project_types.code
ALTER TABLE public.project_types ADD COLUMN IF NOT EXISTS code text;

UPDATE public.project_types SET code='DAT' WHERE name ILIKE '%Data Center%';
UPDATE public.project_types SET code='PIL' WHERE name ILIKE '%Locação%';
UPDATE public.project_types SET code='PIP' WHERE name ILIKE '%Piloto%';
UPDATE public.project_types SET code='PIV' WHERE (name='Implantação Venda (PIV)' OR name ILIKE '%Implantação Venda%') AND code IS NULL;
UPDATE public.project_types SET code='SER' WHERE name ILIKE 'Serviços%' AND code IS NULL;
UPDATE public.project_types SET code='VCP' WHERE name ILIKE '%Venda Complementar%' AND code IS NULL;

INSERT INTO public.project_types(name, code, active) VALUES
  ('Manutenção (MAN)','MAN',true),
  ('Suporte (SUP)','SUP',true),
  ('Venda de Manutenção e Serviço (VMS)','VMS',true),
  ('Licença (LIC)','LIC',true),
  ('Serviços / Integrações (SIN)','SIN',true),
  ('Recall (RCL)','RCL',true),
  ('Genéricos (GEN)','GEN',true),
  ('Internos (INT)','INT',true),
  ('Investimento (INV)','INV',true),
  ('Software (SOW)','SOW',true),
  ('Hardware (PRO)','PRO',true),
  ('Corporativos (COR)','COR',true),
  ('Upgrade (UPGRADE)','UPGRADE',true)
ON CONFLICT DO NOTHING;

-- preenche códigos faltantes em registros legados para evitar erro do NOT NULL
UPDATE public.project_types SET code = upper(substr(regexp_replace(name,'[^A-Za-z]','','g'),1,3))
  WHERE code IS NULL;

ALTER TABLE public.project_types ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS project_types_code_uq ON public.project_types(code);

-- 2) city_codes
CREATE TABLE IF NOT EXISTS public.city_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  city_norm text NOT NULL,
  state text NOT NULL,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS city_codes_city_state_uq ON public.city_codes(city_norm, state);
CREATE UNIQUE INDEX IF NOT EXISTS city_codes_code_uq ON public.city_codes(code);

GRANT SELECT ON public.city_codes TO authenticated;
GRANT ALL ON public.city_codes TO service_role;
ALTER TABLE public.city_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "city_codes_read_auth" ON public.city_codes;
CREATE POLICY "city_codes_read_auth" ON public.city_codes FOR SELECT TO authenticated USING (true);

-- 3) projects.project_code
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_code text;
CREATE UNIQUE INDEX IF NOT EXISTS projects_project_code_uq ON public.projects(project_code);

-- 4) sequence
CREATE SEQUENCE IF NOT EXISTS public.projects_code_seq START 1;
GRANT USAGE ON SEQUENCE public.projects_code_seq TO authenticated, service_role;

-- 5) helpers
CREATE OR REPLACE FUNCTION public._compute_city_sigla(p_city text, p_persist boolean, p_state text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_existing text;
  v_norm text;
  v_words text[];
  v_word text;
  v_len int;
  v_cand text;
  i int; j int; k int; n int;
  w2 text; w3 text;
BEGIN
  SELECT code INTO v_existing FROM city_codes
    WHERE city_norm = public.norm_text(p_city) AND state=p_state LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  v_norm := public.norm_text(p_city);
  v_norm := regexp_replace(v_norm, '[^A-Z\s]', '', 'g');
  v_words := regexp_split_to_array(trim(v_norm), '\s+');
  v_words := ARRAY(SELECT w FROM unnest(v_words) w WHERE length(w)>0);
  n := coalesce(array_length(v_words,1),0);
  IF n = 0 THEN RAISE EXCEPTION 'Cidade inválida: %', p_city; END IF;

  IF n = 1 THEN
    v_word := v_words[1]; v_len := length(v_word);
    IF v_len < 3 THEN RAISE EXCEPTION 'Cidade muito curta para gerar sigla: %', p_city; END IF;
    FOR j IN 2..v_len-1 LOOP
      FOR k IN j+1..v_len LOOP
        v_cand := substr(v_word,1,1)||substr(v_word,j,1)||substr(v_word,k,1);
        IF NOT EXISTS(SELECT 1 FROM city_codes WHERE code=v_cand) THEN
          IF p_persist THEN INSERT INTO city_codes(city,city_norm,state,code) VALUES(p_city,public.norm_text(p_city),p_state,v_cand); END IF;
          RETURN v_cand;
        END IF;
      END LOOP;
    END LOOP;
  ELSIF n = 2 THEN
    v_word := v_words[2]; v_len := length(v_word);
    IF v_len < 2 THEN RAISE EXCEPTION 'Segundo nome da cidade muito curto: %', p_city; END IF;
    FOR j IN 1..v_len-1 LOOP
      FOR k IN j+1..v_len LOOP
        v_cand := substr(v_words[1],1,1)||substr(v_word,j,1)||substr(v_word,k,1);
        IF NOT EXISTS(SELECT 1 FROM city_codes WHERE code=v_cand) THEN
          IF p_persist THEN INSERT INTO city_codes(city,city_norm,state,code) VALUES(p_city,public.norm_text(p_city),p_state,v_cand); END IF;
          RETURN v_cand;
        END IF;
      END LOOP;
    END LOOP;
  ELSE
    w2 := v_words[2]; w3 := v_words[3];
    FOR j IN 1..length(w2) LOOP
      FOR k IN 1..length(w3) LOOP
        v_cand := substr(v_words[1],1,1)||substr(w2,j,1)||substr(w3,k,1);
        IF NOT EXISTS(SELECT 1 FROM city_codes WHERE code=v_cand) THEN
          IF p_persist THEN INSERT INTO city_codes(city,city_norm,state,code) VALUES(p_city,public.norm_text(p_city),p_state,v_cand); END IF;
          RETURN v_cand;
        END IF;
      END LOOP;
    END LOOP;
    IF n >= 4 THEN
      FOR i IN 4..n LOOP
        FOR j IN 1..length(v_words[i]) LOOP
          v_cand := substr(v_words[1],1,1)||substr(v_words[2],1,1)||substr(v_words[i],j,1);
          IF NOT EXISTS(SELECT 1 FROM city_codes WHERE code=v_cand) THEN
            IF p_persist THEN INSERT INTO city_codes(city,city_norm,state,code) VALUES(p_city,public.norm_text(p_city),p_state,v_cand); END IF;
            RETURN v_cand;
          END IF;
        END LOOP;
      END LOOP;
    END IF;
  END IF;

  RAISE EXCEPTION 'Não foi possível gerar sigla única para a cidade %', p_city;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_city_code(p_city text, p_state text)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT public._compute_city_sigla(p_city, true, p_state);
$$;

CREATE OR REPLACE FUNCTION public.preview_project_code(p_city text, p_state text, p_project_type_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_type_code text; v_city_code text;
BEGIN
  SELECT code INTO v_type_code FROM project_types WHERE id=p_project_type_id;
  IF v_type_code IS NULL THEN RETURN NULL; END IF;
  v_city_code := public._compute_city_sigla(p_city, false, p_state);
  RETURN '1'||v_type_code||v_city_code||'·····';
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_project_code(p_city text, p_state text, p_project_type_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_type_code text; v_city_code text; v_seq bigint;
BEGIN
  SELECT code INTO v_type_code FROM project_types WHERE id=p_project_type_id;
  IF v_type_code IS NULL THEN RAISE EXCEPTION 'Tipo de projeto inválido'; END IF;
  v_city_code := public.resolve_city_code(p_city, p_state);
  v_seq := nextval('public.projects_code_seq');
  RETURN '1'||v_type_code||v_city_code||lpad(v_seq::text,5,'0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.preview_project_code(text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_city_code(text,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_project_code(text,text,uuid) TO authenticated, service_role;

-- 6) trigger
CREATE OR REPLACE FUNCTION public.projects_set_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    IF NEW.project_type_id IS NULL THEN
      RAISE EXCEPTION 'project_type_id é obrigatório para gerar o código do projeto';
    END IF;
    NEW.project_code := public.generate_project_code(NEW.city, NEW.state::text, NEW.project_type_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_set_code ON public.projects;
CREATE TRIGGER trg_projects_set_code BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.projects_set_code();

-- 7) backfill
DO $$
DECLARE r record; v_code text; v_type uuid;
BEGIN
  FOR r IN SELECT id, city, state::text AS state, project_type_id FROM public.projects
            WHERE project_code IS NULL ORDER BY created_at LOOP
    v_type := r.project_type_id;
    IF v_type IS NULL THEN
      SELECT id INTO v_type FROM public.project_types WHERE code='PIV' LIMIT 1;
      UPDATE public.projects SET project_type_id=v_type WHERE id=r.id;
    END IF;
    v_code := public.generate_project_code(r.city, r.state, v_type);
    UPDATE public.projects SET project_code=v_code WHERE id=r.id;
  END LOOP;
END $$;
