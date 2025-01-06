-- First, ensure the bucket exists and is public
insert into storage.buckets (id, name, public)
values ('templates', 'templates', true)
on conflict (id) do update set public = true;

-- Drop all existing policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload templates" on storage.objects;
drop policy if exists "Users can update their own template files" on storage.objects;
drop policy if exists "Users can delete their own template files" on storage.objects;
drop policy if exists "Allow all operations for authenticated users" on storage.objects;

-- Create a completely open policy for testing
create policy "Allow all storage operations"
on storage.objects for all
using ( bucket_id = 'templates' )
with check ( bucket_id = 'templates' );

-- Make sure RLS is enabled
alter table storage.objects enable row level security;
