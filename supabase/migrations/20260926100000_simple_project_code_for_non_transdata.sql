-- Código de projeto simplificado pra qualquer tenant que não seja a
-- Transdata: "<número do cliente>-<sequencial de 4 dígitos>", ex: "2-0001".
-- Não depende de tipo de projeto, cidade/estado ou nenhum catálogo — só do
-- tenant. A Transdata continua com a geração antiga, 100% intocada.

-- 1) Número do cliente: sequencial, atribuído uma única vez (não muda se
--    outro tenant for excluído depois), na ordem em que passaram a existir.
CREATE SEQUENCE IF NOT EXISTS public.tenants_client_number_seq;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS client_number integer;

DO $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN SELECT id FROM public.tenants WHERE client_number IS NULL ORDER BY created_at LOOP
    n := n + 1;
    UPDATE public.tenants SET client_number = n WHERE id = r.id;
  END LOOP;
  IF n > 0 THEN PERFORM setval('public.tenants_client_number_seq', n); END IF;
END $$;

ALTER TABLE public.tenants ALTER COLUMN client_number SET DEFAULT nextval('public.tenants_client_number_seq');
ALTER TABLE public.tenants ALTER COLUMN client_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tenants_client_number_uq ON public.tenants(client_number);

-- 2) Contador de projetos por tenant (sequencial próprio, reinicia do zero
--    pra cada cliente).
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS project_seq integer NOT NULL DEFAULT 0;

-- 3) Trigger de código: ramifica por tenant, sem depender da ordem de
--    execução de outros triggers em projects (usa get_my_tenant_id(), não
--    NEW.tenant_id, então funciona independente de quando o outro trigger
--    de tenant_id roda).
CREATE OR REPLACE FUNCTION public.projects_set_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant uuid;
  v_client_number int;
  v_seq int;
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    v_tenant := public.get_my_tenant_id();

    IF v_tenant = 'a2f1c8e0-0000-4000-8000-000000000001' THEN
      IF NEW.project_type_id IS NULL THEN
        RAISE EXCEPTION 'project_type_id é obrigatório para gerar o código do projeto';
      END IF;
      NEW.project_code := public.generate_project_code(
        NEW.city, NEW.state::text, NEW.project_type_id, NEW.project_segment, NEW.company_name, NEW.country_code
      );
    ELSE
      UPDATE public.tenants SET project_seq = project_seq + 1
        WHERE id = v_tenant
        RETURNING client_number, project_seq INTO v_client_number, v_seq;
      IF v_client_number IS NULL THEN
        RAISE EXCEPTION 'Não foi possível identificar o cliente para gerar o código do projeto';
      END IF;
      NEW.project_code := v_client_number::text || '-' || lpad(v_seq::text, 4, '0');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Prévia (mostrada no formulário antes de salvar) segue a mesma regra.
CREATE OR REPLACE FUNCTION public.preview_project_code(p_city text, p_state text, p_project_type_id uuid, p_segment text, p_company_name text, p_country text DEFAULT 'BR')
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_type text; v_region text; v_tenant uuid; v_client_number int; v_next_seq int;
BEGIN
  v_tenant := public.get_my_tenant_id();

  IF v_tenant = 'a2f1c8e0-0000-4000-8000-000000000001' THEN
    SELECT short_code INTO v_type FROM project_types WHERE id = p_project_type_id;
    IF v_type IS NULL THEN RETURN NULL; END IF;
    v_region := CASE WHEN upper(coalesce(p_country,'BR')) = 'BR' THEN upper(coalesce(p_state,'')) ELSE upper(coalesce(p_country,'')) END;
    RETURN substr(public.code_token(p_city),1,3)
        || v_region
        || upper(v_type)
        || public.segment_code(p_segment)
        || '····'
        || '-' || public.code_token(p_company_name);
  ELSE
    SELECT client_number, project_seq + 1 INTO v_client_number, v_next_seq FROM public.tenants WHERE id = v_tenant;
    IF v_client_number IS NULL THEN RETURN NULL; END IF;
    RETURN v_client_number::text || '-' || lpad(v_next_seq::text, 4, '0');
  END IF;
END;
$$;
