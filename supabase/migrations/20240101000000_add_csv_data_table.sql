-- Create csv_data table
create table if not exists public.csv_data (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    recipient_name text,
    email text,
    certificate_id text,
    issue_date timestamp with time zone,
    additional_data jsonb default '{}'::jsonb,
    uploaded_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.csv_data enable row level security;

-- Create policies
create policy "Users can insert their own csv data"
    on public.csv_data for insert
    with check (auth.uid() = user_id);

create policy "Users can view their own csv data"
    on public.csv_data for select
    using (auth.uid() = user_id);

create policy "Users can update their own csv data"
    on public.csv_data for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own csv data"
    on public.csv_data for delete
    using (auth.uid() = user_id);

-- Create indexes
create index csv_data_user_id_idx on public.csv_data(user_id);
create index csv_data_uploaded_at_idx on public.csv_data(uploaded_at);

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_csv_data_updated_at
    before update on public.csv_data
    for each row
    execute procedure public.handle_updated_at();
