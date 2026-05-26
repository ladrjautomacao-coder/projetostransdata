
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS reached_implemented boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reached_implemented_at timestamptz NULL;

UPDATE public.projects
  SET reached_implemented = true,
      reached_implemented_at = COALESCE(reached_implemented_at, updated_at, now())
  WHERE status = 'encerrado' AND reached_implemented = false;
