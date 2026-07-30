UPDATE public.role_presets
SET permissions = jsonb_set(
  permissions,
  '{modules,financeiro}',
  '{"view": true}'::jsonb,
  true
)
WHERE role IN ('executivo','comercial');