-- Drop user_role type if it exists
DROP TYPE IF EXISTS user_role;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    user_role TEXT NOT NULL DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'super_admin'))
);

-- Update existing admin profile
INSERT INTO public.profiles (id, user_role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@certificategenerator.com'
ON CONFLICT (id) 
DO UPDATE SET user_role = 'admin';

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND user_role = 'admin'
    ));

CREATE POLICY "Admins can update all profiles"
    ON public.profiles
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND user_role = 'admin'
    ));
