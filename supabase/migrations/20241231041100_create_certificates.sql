-- Enable required extensions
create extension if not exists "moddatetime" schema extensions;

-- Create certificates table
create table if not exists public.certificates (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    template_id uuid references public.templates(id) on delete set null,
    title text not null,
    recipient_name text not null,
    issue_date timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.certificates enable row level security;

-- Create policies
create policy "Users can view their own certificates"
    on public.certificates
    for select
    using (auth.uid() = user_id);

create policy "Users can create their own certificates"
    on public.certificates
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own certificates"
    on public.certificates
    for update
    using (auth.uid() = user_id);

create policy "Users can delete their own certificates"
    on public.certificates
    for delete
    using (auth.uid() = user_id);

-- Create updated_at trigger
create trigger handle_updated_at before update
    on public.certificates
    for each row
    execute function extensions.moddatetime();

-- Create indexes
create index certificates_user_id_idx on public.certificates(user_id);
create index certificates_template_id_idx on public.certificates(template_id);
