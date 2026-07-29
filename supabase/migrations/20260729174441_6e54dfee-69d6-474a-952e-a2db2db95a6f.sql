UPDATE public.role_presets
SET permissions = jsonb_set(
  permissions,
  '{modules,suporte}',
  '{"view": true}'::jsonb,
  true
)
WHERE role IN ('super_admin','admin','gerente_projetos','executivo','comercial','leitor','user');