-- First, create all tables
-- Create profiles table if it doesn't exist (needs to be first as other policies depend on it)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    user_role TEXT NOT NULL DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'super_admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'deactivated')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create system_settings table
create table if not exists public.system_settings (
    id uuid default gen_random_uuid() primary key,
    key text not null unique,
    value jsonb not null,
    description text not null,
    category text not null check (category in ('general', 'email', 'api', 'security', 'storage')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create email_templates table
create table if not exists public.email_templates (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    subject text not null,
    content text not null,
    variables jsonb not null default '[]'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create api_logs table
create table if not exists public.api_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id),
    endpoint text not null,
    method text not null,
    status_code integer not null,
    response_time numeric not null,
    created_at timestamptz default now()
);

-- Create error_logs table
create table if not exists public.error_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id),
    error_type text not null,
    error_message text not null,
    stack_trace text,
    metadata jsonb,
    created_at timestamptz default now()
);

-- Create system_performance table
create table if not exists public.system_performance (
    id uuid default gen_random_uuid() primary key,
    cpu_usage numeric not null,
    memory_usage numeric not null,
    disk_usage numeric not null,
    response_time numeric not null,
    timestamp timestamptz default now()
);

-- Create activity_logs table
create table if not exists public.activity_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id),
    action text not null,
    details jsonb,
    created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table public.system_settings enable row level security;
alter table public.email_templates enable row level security;
alter table public.api_logs enable row level security;
alter table public.error_logs enable row level security;
alter table public.system_performance enable row level security;
alter table public.activity_logs enable row level security;

-- Create admin check function for reuse
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND user_role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create all policies
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Only admins can update any profile"
    ON profiles FOR UPDATE
    USING (is_admin(auth.uid()));

-- System settings policies
create policy "System settings are viewable by authenticated users"
    on public.system_settings for select
    to authenticated
    using (true);

create policy "System settings are editable by admins only"
    on public.system_settings for all
    to authenticated
    using (is_admin(auth.uid()));

-- Email templates policies
create policy "Email templates are viewable by authenticated users"
    on public.email_templates for select
    to authenticated
    using (true);

create policy "Email templates are editable by admins only"
    on public.email_templates for all
    to authenticated
    using (is_admin(auth.uid()));

-- API logs policies
create policy "API logs are viewable by admins only"
    on public.api_logs for select
    to authenticated
    using (is_admin(auth.uid()));

-- Error logs policies
create policy "Error logs are viewable by admins only"
    on public.error_logs for select
    to authenticated
    using (is_admin(auth.uid()));

-- System performance policies
create policy "System performance is viewable by admins only"
    on public.system_performance for select
    to authenticated
    using (is_admin(auth.uid()));

-- Activity logs policies
create policy "Activity logs are viewable by admins only"
    on public.activity_logs for select
    to authenticated
    using (is_admin(auth.uid()));

-- Create functions for logging
create or replace function public.log_api_call(
    p_user_id uuid,
    p_endpoint text,
    p_method text,
    p_status_code integer,
    p_response_time numeric
) returns void as $$
begin
    insert into public.api_logs (user_id, endpoint, method, status_code, response_time)
    values (p_user_id, p_endpoint, p_method, p_status_code, p_response_time);
end;
$$ language plpgsql security definer;

create or replace function public.log_error(
    p_user_id uuid,
    p_error_type text,
    p_error_message text,
    p_stack_trace text default null,
    p_metadata jsonb default null
) returns void as $$
begin
    insert into public.error_logs (user_id, error_type, error_message, stack_trace, metadata)
    values (p_user_id, p_error_type, p_error_message, p_stack_trace, p_metadata);
end;
$$ language plpgsql security definer;

create or replace function public.log_activity(
    p_user_id uuid,
    p_action text,
    p_details jsonb default null
) returns void as $$
begin
    insert into public.activity_logs (user_id, action, details)
    values (p_user_id, p_action, p_details);
end;
$$ language plpgsql security definer;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, user_role, status)
    VALUES (new.id, new.email, 'user', 'active');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user role (only admins can do this)
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can update roles';
    END IF;

    UPDATE profiles
    SET user_role = new_role,
        updated_at = timezone('utc', now())
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default data
-- Insert default system settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
    ('max_file_size', '10485760'::jsonb, 'Maximum file size for uploads in bytes', 'storage'),
    ('allowed_file_types', '["image/jpeg", "image/png", "image/gif"]'::jsonb, 'Allowed file types for uploads', 'storage'),
    ('rate_limit', '100'::jsonb, 'Maximum API requests per minute', 'api'),
    ('email_from', '"Certificate Generator <noreply@example.com>"'::jsonb, 'From address for emails', 'email'),
    ('enable_registration', 'true'::jsonb, 'Allow new user registrations', 'security'),
    ('require_email_verification', 'true'::jsonb, 'Require email verification for new accounts', 'security'),
    ('session_timeout', '3600'::jsonb, 'Session timeout in seconds', 'security'),
    ('backup_frequency', '"daily"'::jsonb, 'Frequency of automatic backups', 'general'),
    ('maintenance_mode', 'false'::jsonb, 'Enable maintenance mode', 'general')
ON CONFLICT (key) DO NOTHING;

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, content, variables) VALUES
    ('welcome', 
     'Welcome to Certificate Generator', 
     'Hello {{name}},\n\nWelcome to Certificate Generator! We''re excited to have you on board.\n\nBest regards,\nThe Certificate Generator Team', 
     '["name"]'::jsonb),
    ('password_reset', 
     'Password Reset Request', 
     'Hello {{name}},\n\nYou have requested to reset your password. Click the link below to proceed:\n\n{{reset_link}}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Certificate Generator Team', 
     '["name", "reset_link"]'::jsonb),
    ('email_verification', 
     'Verify Your Email', 
     'Hello {{name}},\n\nPlease verify your email address by clicking the link below:\n\n{{verification_link}}\n\nBest regards,\nThe Certificate Generator Team', 
     '["name", "verification_link"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create initial admin user
DO $$
DECLARE
    admin_id UUID := gen_random_uuid();
BEGIN
    -- Create admin user if not exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
    ) THEN
        -- Insert directly into auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            last_sign_in_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            admin_id,
            '00000000-0000-0000-0000-000000000000',
            'admin@example.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{"role": "admin"}'::jsonb,
            now(),
            now(),
            now(),
            encode(gen_random_bytes(32), 'hex'),
            encode(gen_random_bytes(32), 'hex')
        );

        -- Create admin profile
        INSERT INTO profiles (id, email, user_role, status)
        VALUES (admin_id, 'admin@example.com', 'admin', 'active')
        ON CONFLICT (id) DO UPDATE
        SET user_role = 'admin',
            status = 'active';
    END IF;
END $$;
