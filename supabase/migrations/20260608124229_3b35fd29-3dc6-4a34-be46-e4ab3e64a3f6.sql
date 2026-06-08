-- The manuals bucket is public; files are served via direct public URL
-- and do not require a broad SELECT policy on storage.objects.
-- Removing the broad public SELECT policy prevents clients from listing
-- all files in the bucket while keeping direct public downloads working.
DROP POLICY IF EXISTS "Public can read manuals" ON storage.objects;