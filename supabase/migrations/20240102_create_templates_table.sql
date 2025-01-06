-- Create templates table if it doesn't exist
create table if not exists public.templates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    metadata jsonb default '{}'::jsonb,
    document_type text check (document_type in ('pdf', 'docx', 'pptx')),
    storage_path text,
    public_url text,
    is_active boolean default true
);

-- Add RLS
alter table public.templates enable row level security;

-- Create policies
create policy "Users can view their own templates"
    on public.templates for select
    using (auth.uid() = user_id);

create policy "Users can create their own templates"
    on public.templates for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own templates"
    on public.templates for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own templates"
    on public.templates for delete
    using (auth.uid() = user_id);

-- Create indexes
create index if not exists templates_user_id_idx on public.templates(user_id);
create index if not exists templates_created_at_idx on public.templates(created_at);

-- Add updated_at trigger
create trigger handle_updated_at
    before update on public.templates
    for each row
    execute function public.handle_updated_at();
