ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS fleet_urbano integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fleet_seccionado integer NOT NULL DEFAULT 0;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_fleet_system_nonneg
  CHECK (fleet_urbano >= 0 AND fleet_seccionado >= 0);

UPDATE public.projects
  SET fleet_urbano = COALESCE(fleet_size, 0)
  WHERE fleet_urbano = 0 AND fleet_seccionado = 0;