ALTER TABLE public.project_notes
  ALTER COLUMN updated_at DROP DEFAULT;

UPDATE public.project_notes
SET updated_at = created_at
WHERE updated_at > created_at;

ALTER TABLE public.project_notes
  ALTER COLUMN updated_at SET DEFAULT now();