-- Enable storage policies for authenticated users
BEGIN;

-- Create certificates bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('certificates', 'certificates')
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND 
  (storage.foldername(name))[1] = 'templates'
);

-- Policy to allow authenticated users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'certificates' AND 
  (storage.foldername(name))[1] = 'templates'
);

-- Policy to allow authenticated users to read all files
CREATE POLICY "Allow authenticated users to read all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates' AND 
  (storage.foldername(name))[1] = 'templates'
);

-- Policy to allow users to delete their own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificates' AND 
  (storage.foldername(name))[1] = 'templates'
);

COMMIT;
