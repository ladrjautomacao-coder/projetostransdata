
-- 1) Novos papéis
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerente_projetos';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'executivo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comercial';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'leitor';
