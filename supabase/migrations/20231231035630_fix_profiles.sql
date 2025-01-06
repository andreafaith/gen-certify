-- Drop existing policies
drop policy if exists "Enable read access for authenticated users" on profiles;
drop policy if exists "Enable update access for users based on id" on profiles;
drop policy if exists "Enable insert access for authenticated users" on profiles;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- Backup existing data
create temp table profiles_backup as 
select * from profiles;

-- Drop foreign key constraints
alter table templates drop constraint if exists templates_user_id_fkey;
alter table certificates drop constraint if exists certificates_user_id_fkey;
alter table batch_jobs drop constraint if exists batch_jobs_user_id_fkey;

-- Drop and recreate the profiles table
drop table if exists profiles;

-- Create profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    user_role text not null default 'user' check (user_role in ('user', 'admin', 'super_admin')),
    updated_at timestamptz default now(),
    constraint proper_updated_at check(updated_at <= now())
);

-- Restore data from backup
insert into profiles (id, full_name, updated_at, user_role)
select id, full_name, updated_at, 'user'
from profiles_backup
on conflict (id) do nothing;

-- Recreate foreign key constraints
alter table templates 
    add constraint templates_user_id_fkey 
    foreign key (user_id) references profiles(id) on delete cascade;

alter table certificates 
    add constraint certificates_user_id_fkey 
    foreign key (user_id) references profiles(id) on delete cascade;

alter table batch_jobs 
    add constraint batch_jobs_user_id_fkey 
    foreign key (user_id) references profiles(id) on delete cascade;

-- Drop temporary table
drop table profiles_backup;

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

create policy "Users can insert their own profile."
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile."
    on profiles for update
    using ( auth.uid() = id );

create policy "Admins can update any profile"
    on profiles for update
    using (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND user_role = 'admin'
    ));

-- Function to handle new user profiles
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, user_role)
    values (new.id, new.raw_user_meta_data->>'full_name', 'user');
    return new;
end;
$$;

-- Trigger for new users
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Insert initial data for existing users
insert into public.profiles (id, full_name, user_role)
select id, raw_user_meta_data->>'full_name', 'user'
from auth.users
on conflict (id) do nothing;
