-- Create templates bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('templates', 'templates', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload template files
create policy "Users can upload template files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'templates' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own template files
create policy "Users can update their template files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'templates' and
  auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'templates' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own template files
create policy "Users can delete their template files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'templates' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to template files
create policy "Template files are publicly accessible"
on storage.objects for select
to public
using (bucket_id = 'templates');
