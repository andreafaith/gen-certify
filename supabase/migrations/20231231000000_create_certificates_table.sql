-- Drop existing table if it exists
DROP TABLE IF EXISTS public.certificates CASCADE;

-- Create certificates table
CREATE TABLE public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Verify the table was created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'certificates' 
        AND column_name = 'status'
    ) THEN
        RAISE EXCEPTION 'Table certificates or status column was not created properly';
    END IF;
END
$$;
