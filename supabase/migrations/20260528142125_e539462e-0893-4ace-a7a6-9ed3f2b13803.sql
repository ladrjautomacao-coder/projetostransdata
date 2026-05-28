
INSERT INTO storage.buckets (id, name, public)
VALUES ('manuals', 'manuals', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public can read manuals"
ON storage.objects FOR SELECT
USING (bucket_id = 'manuals');
