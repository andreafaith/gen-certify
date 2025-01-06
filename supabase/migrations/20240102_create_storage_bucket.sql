-- Create templates bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('templates', 'templates', true)
on conflict (id) do nothing;

-- Allow public access to template files
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'templates' );

-- Allow authenticated users to upload template files
create policy "Authenticated users can upload templates"
on storage.objects for insert
with check (
  bucket_id = 'templates' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own template files
create policy "Users can update their own template files"
on storage.objects for update
using (
  bucket_id = 'templates' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own template files
create policy "Users can delete their own template files"
on storage.objects for delete
using (
  bucket_id = 'templates' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
