-- Fase 1: garante que nenhuma linha já existente ficou com tenant_id nulo
-- (o DEFAULT da migration anterior só vale para linhas novas).
UPDATE public.profiles SET tenant_id = 'a2f1c8e0-0000-4000-8000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.projects SET tenant_id = 'a2f1c8e0-0000-4000-8000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.team_members SET tenant_id = 'a2f1c8e0-0000-4000-8000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.products SET tenant_id = 'a2f1c8e0-0000-4000-8000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.project_types SET tenant_id = 'a2f1c8e0-0000-4000-8000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.solutions SET tenant_id = 'a2f1c8e0-0000-4000-8000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.solution_features SET tenant_id = 'a2f1c8e0-0000-4000-8000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.integrations SET tenant_id = 'a2f1c8e0-0000-4000-8000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.equipment_types SET tenant_id = 'a2f1c8e0-0000-4000-8000-000000000001' WHERE tenant_id IS NULL;
