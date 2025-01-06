-- Drop existing policies if they exist
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload templates" on storage.objects;
drop policy if exists "Users can update their own template files" on storage.objects;
drop policy if exists "Users can delete their own template files" on storage.objects;

-- Create a simpler policy for testing
create policy "Allow all operations for authenticated users"
on storage.objects for all
using (
  bucket_id = 'templates' 
  and auth.role() = 'authenticated'
)
with check (
  bucket_id = 'templates' 
  and auth.role() = 'authenticated'
);

-- Enable RLS
alter table storage.objects enable row level security;
