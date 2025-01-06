-- Add properties column to templates table
alter table public.templates
add column if not exists properties jsonb not null default '{}'::jsonb;

-- Add status column if it doesn't exist
alter table public.templates
add column if not exists status text not null default 'active'
check (status in ('active', 'pending', 'archived', 'deleted'));

-- Add file related columns if they don't exist
alter table public.templates
add column if not exists file_path text,
add column if not exists file_url text,
add column if not exists file_type text;

-- Update RLS policies
create policy "Users can insert their own templates"
    on public.templates for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own templates"
    on public.templates for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can view their own templates"
    on public.templates for select
    using (auth.uid() = user_id);

create policy "Users can delete their own templates"
    on public.templates for delete
    using (auth.uid() = user_id);
