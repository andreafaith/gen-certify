-- Add role enum type if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
    END IF;
END $$;

-- Add account status enum type if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE account_status AS ENUM ('active', 'suspended', 'pending', 'deactivated');
    END IF;
END $$;

-- Add role and status to auth.users
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'active';

-- Create system settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create usage statistics table
CREATE TABLE IF NOT EXISTS public.usage_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies (drop existing ones first to avoid conflicts)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs;

ALTER TABLE public.usage_statistics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own statistics" ON public.usage_statistics;
DROP POLICY IF EXISTS "Admins can view all statistics" ON public.usage_statistics;

-- Recreate policies
CREATE POLICY "Admins can manage system settings"
    ON public.system_settings
    USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage email templates"
    ON public.email_templates
    USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

CREATE POLICY "Users can view their own logs"
    ON public.activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs"
    ON public.activity_logs
    USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

CREATE POLICY "Users can view their own statistics"
    ON public.usage_statistics
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all statistics"
    ON public.usage_statistics
    USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Insert default system settings if they don't exist
INSERT INTO public.system_settings (key, value, description, category)
SELECT 'max_certificates_per_batch', '100'::jsonb, 'Maximum number of certificates that can be generated in a single batch', 'generation'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'max_certificates_per_batch');

INSERT INTO public.system_settings (key, value, description, category)
SELECT 'allowed_output_formats', '["pdf", "docx", "pptx"]'::jsonb, 'Allowed output formats for certificate generation', 'generation'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'allowed_output_formats');

INSERT INTO public.system_settings (key, value, description, category)
SELECT 'email_notifications_enabled', 'true'::jsonb, 'Whether email notifications are enabled system-wide', 'notifications'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'email_notifications_enabled');

INSERT INTO public.system_settings (key, value, description, category)
SELECT 'max_storage_per_user', '1073741824'::jsonb, 'Maximum storage allowed per user in bytes (1GB default)', 'storage'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'max_storage_per_user');

-- Insert default email templates if they don't exist
INSERT INTO public.email_templates (name, subject, content, variables)
SELECT 
    'welcome_email',
    'Welcome to Certificate Generator!',
    'Hello {{name}},\n\nWelcome to Certificate Generator! We''re excited to have you on board.\n\nBest regards,\nThe Team',
    '{"name": "User''s full name"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE name = 'welcome_email');

INSERT INTO public.email_templates (name, subject, content, variables)
SELECT 
    'certificate_generated',
    'Your Certificate is Ready!',
    'Hello {{name}},\n\nYour certificate "{{certificate_title}}" has been generated successfully.\n\nBest regards,\nThe Team',
    '{"name": "User''s full name", "certificate_title": "Title of the certificate"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE name = 'certificate_generated');
