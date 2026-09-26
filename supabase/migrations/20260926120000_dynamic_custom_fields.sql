-- Evolução dos "5 campos genéricos" pra motor de campos totalmente livre:
-- nome, tipo e obrigatoriedade quem manda é o admin de cada tenant (fora da
-- Transdata), sem limite de quantidade. Os 5 slots fixos criados ontem
-- nunca chegaram a ter dado real (feature ainda em teste), então é seguro
-- trocar por uma coluna jsonb.
ALTER TABLE public.projects DROP COLUMN IF EXISTS custom_field_1;
ALTER TABLE public.projects DROP COLUMN IF EXISTS custom_field_2;
ALTER TABLE public.projects DROP COLUMN IF EXISTS custom_field_3;
ALTER TABLE public.projects DROP COLUMN IF EXISTS custom_field_4;
ALTER TABLE public.projects DROP COLUMN IF EXISTS custom_field_5;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS custom_data jsonb NOT NULL DEFAULT '{}'::jsonb;

-- tenant_branding.custom_fields já existe (criada em 20260926110000) e já é
-- jsonb — só muda o formato do array guardado nela (id/label/type/options/
-- required em vez de key/label/type/active), não precisa de migration de
-- coluna pra isso.
