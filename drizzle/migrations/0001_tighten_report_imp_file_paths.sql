DROP POLICY IF EXISTS "Report IMP editors can insert own metadata" ON public.report_imp_files;
CREATE POLICY "Report IMP editors can insert own metadata"
ON public.report_imp_files FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND public.has_permission(auth.uid(), 'report_imp', 'create')
  AND public.can_view_project(project_id)
  AND file_path LIKE project_id::text || '/' || auth.uid()::text || '/%'
);

DROP POLICY IF EXISTS "Report IMP editors can upload files" ON storage.objects;
CREATE POLICY "Report IMP editors can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'report-imp'
  AND owner = auth.uid()
  AND public.has_permission(auth.uid(), 'report_imp', 'create')
  AND (storage.foldername(name))[2] = auth.uid()::text
);