-- Create field_mappings table
create table if not exists public.field_mappings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    template_id uuid references public.templates(id) on delete cascade not null,
    name text not null,
    mapping jsonb not null default '{}'::jsonb,
    default_values jsonb not null default '{}'::jsonb,
    transformations jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.field_mappings enable row level security;

-- Create policies
create policy "Users can insert their own field mappings"
    on public.field_mappings for insert
    with check (auth.uid() = user_id);

create policy "Users can view their own field mappings"
    on public.field_mappings for select
    using (auth.uid() = user_id);

create policy "Users can update their own field mappings"
    on public.field_mappings for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own field mappings"
    on public.field_mappings for delete
    using (auth.uid() = user_id);

-- Create indexes
create index field_mappings_user_id_idx on public.field_mappings(user_id);
create index field_mappings_template_id_idx on public.field_mappings(template_id);

-- Add updated_at trigger
create trigger handle_field_mappings_updated_at
    before update on public.field_mappings
    for each row
    execute procedure public.handle_updated_at();
