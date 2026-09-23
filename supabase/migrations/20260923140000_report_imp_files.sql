-- Ports the report_imp_files table + RLS policies that previously only
-- existed as Drizzle migrations (drizzle/migrations/0000, 0001), never
-- tracked in supabase/migrations. Written directly to its final state
-- (post-tightening), matching what was applied to the old database.
CREATE TABLE public.report_imp_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL UNIQUE,
  file_size bigint NOT NULL,
  content_type text,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT report_imp_files_size_valid CHECK (file_size >= 0 AND file_size <= 104857600)
);

GRANT SELECT, INSERT, DELETE ON public.report_imp_files TO authenticated;
GRANT ALL ON public.report_imp_files TO service_role;

ALTER TABLE public.report_imp_files ENABLE ROW LEVEL SECURITY;

CREATE INDEX report_imp_files_project_created_idx
  ON public.report_imp_files (project_id, created_at DESC);
CREATE INDEX report_imp_files_uploaded_by_idx
  ON public.report_imp_files (uploaded_by);

CREATE POLICY "Report IMP viewers can read metadata"
ON public.report_imp_files FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'report_imp', 'view'));

CREATE POLICY "Report IMP editors can insert own metadata"
ON public.report_imp_files FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND public.has_permission(auth.uid(), 'report_imp', 'create')
  AND public.can_view_project(project_id)
  AND file_path LIKE project_id::text || '/' || auth.uid()::text || '/%'
);

CREATE POLICY "Uploaders or admins can delete Report IMP metadata"
ON public.report_imp_files FOR DELETE TO authenticated
USING (
  public.has_permission(auth.uid(), 'report_imp', 'delete')
  AND (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  )
);

CREATE POLICY "Report IMP editors can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'report-imp'
  AND owner = auth.uid()
  AND public.has_permission(auth.uid(), 'report_imp', 'create')
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Report IMP viewers can download files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'report-imp'
  AND public.has_permission(auth.uid(), 'report_imp', 'view')
  AND EXISTS (
    SELECT 1 FROM public.report_imp_files rif
    WHERE rif.file_path = storage.objects.name
  )
);

CREATE POLICY "Uploaders or admins can delete Report IMP files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'report-imp'
  AND public.has_permission(auth.uid(), 'report_imp', 'delete')
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  )
);
