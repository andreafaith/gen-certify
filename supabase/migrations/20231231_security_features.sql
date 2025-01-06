-- Create system_performance table for monitoring
create table if not exists public.system_performance (
    id uuid primary key default gen_random_uuid(),
    timestamp timestamptz not null default now(),
    metric_name text not null,
    metric_value float not null,
    metadata jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create api_logs table for rate limiting and monitoring
create table if not exists public.api_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    endpoint text not null,
    method text not null,
    status_code integer not null,
    response_time float not null,
    ip_address text,
    user_agent text,
    request_body jsonb,
    response_body jsonb,
    created_at timestamptz default now()
);

-- Create error_logs table for error tracking
create table if not exists public.error_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    error_type text not null,
    error_message text not null,
    stack_trace text,
    metadata jsonb,
    created_at timestamptz default now()
);

-- Create activity_logs table for user activity tracking
create table if not exists public.activity_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    action text not null,
    details text,
    metadata jsonb,
    created_at timestamptz default now()
);

-- Add RLS policies
alter table public.system_performance enable row level security;
alter table public.api_logs enable row level security;
alter table public.error_logs enable row level security;
alter table public.activity_logs enable row level security;

-- System performance policies
create policy "System performance viewable by admins"
    on public.system_performance for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.user_role = 'admin'
        )
    );

-- API logs policies
create policy "API logs viewable by admins"
    on public.api_logs for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.user_role = 'admin'
        )
    );

create policy "Users can view their own API logs"
    on public.api_logs for select
    using (auth.uid() = user_id);

-- Error logs policies
create policy "Error logs viewable by admins"
    on public.error_logs for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.user_role = 'admin'
        )
    );

create policy "Users can view their own error logs"
    on public.error_logs for select
    using (auth.uid() = user_id);

-- Activity logs policies
create policy "Activity logs viewable by admins"
    on public.activity_logs for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.user_role = 'admin'
        )
    );

create policy "Users can view their own activity logs"
    on public.activity_logs for select
    using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_api_logs_user_id_created_at 
    on public.api_logs (user_id, created_at desc);

create index if not exists idx_error_logs_user_id_created_at 
    on public.error_logs (user_id, created_at desc);

create index if not exists idx_activity_logs_user_id_created_at 
    on public.activity_logs (user_id, created_at desc);

create index if not exists idx_system_performance_metric_name_timestamp 
    on public.system_performance (metric_name, timestamp desc);

-- Create functions for logging
create or replace function log_api_call(
    p_user_id uuid,
    p_endpoint text,
    p_method text,
    p_status_code integer,
    p_response_time float,
    p_request_body jsonb default null,
    p_response_body jsonb default null
) returns void as $$
begin
    insert into public.api_logs (
        user_id, endpoint, method, status_code, response_time,
        request_body, response_body
    ) values (
        p_user_id, p_endpoint, p_method, p_status_code, p_response_time,
        p_request_body, p_response_body
    );
end;
$$ language plpgsql security definer;

create or replace function log_error(
    p_user_id uuid,
    p_error_type text,
    p_error_message text,
    p_stack_trace text default null,
    p_metadata jsonb default null
) returns void as $$
begin
    insert into public.error_logs (
        user_id, error_type, error_message, stack_trace, metadata
    ) values (
        p_user_id, p_error_type, p_error_message, p_stack_trace, p_metadata
    );
end;
$$ language plpgsql security definer;

create or replace function log_activity(
    p_user_id uuid,
    p_action text,
    p_details text default null,
    p_metadata jsonb default null
) returns void as $$
begin
    insert into public.activity_logs (
        user_id, action, details, metadata
    ) values (
        p_user_id, p_action, p_details, p_metadata
    );
end;
$$ language plpgsql security definer;

-- Create function to clean old logs
create or replace function clean_old_logs(
    p_days_to_keep integer default 30
) returns void as $$
begin
    -- Delete old API logs
    delete from public.api_logs
    where created_at < now() - (p_days_to_keep || ' days')::interval;

    -- Delete old error logs
    delete from public.error_logs
    where created_at < now() - (p_days_to_keep || ' days')::interval;

    -- Delete old activity logs
    delete from public.activity_logs
    where created_at < now() - (p_days_to_keep || ' days')::interval;

    -- Delete old system performance logs
    delete from public.system_performance
    where timestamp < now() - (p_days_to_keep || ' days')::interval;
end;
$$ language plpgsql security definer;
