-- Verify table exists before proceeding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'certificates' 
        AND column_name = 'status'
    ) THEN
        RAISE EXCEPTION 'Table certificates or status column does not exist';
    END IF;
END
$$;

-- Drop existing constraints if they exist
ALTER TABLE public.certificates 
    DROP CONSTRAINT IF EXISTS certificates_status_check;

-- Add status check constraint
ALTER TABLE public.certificates 
ADD CONSTRAINT certificates_status_check 
CHECK (status IN ('draft', 'generated', 'sent', 'revoked'));

-- Drop existing indexes
DROP INDEX IF EXISTS certificates_user_id_idx;
DROP INDEX IF EXISTS certificates_template_id_idx;
DROP INDEX IF EXISTS certificates_status_idx;

-- Create indexes
CREATE INDEX IF NOT EXISTS certificates_user_id_idx ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS certificates_template_id_idx ON public.certificates(template_id);
CREATE INDEX IF NOT EXISTS certificates_status_idx ON public.certificates(status);

-- Add RLS policies
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
CREATE POLICY "Users can view their own certificates"
    ON public.certificates FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own certificates" ON public.certificates;
CREATE POLICY "Users can insert their own certificates"
    ON public.certificates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own certificates" ON public.certificates;
CREATE POLICY "Users can update their own certificates"
    ON public.certificates FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own certificates" ON public.certificates;
CREATE POLICY "Users can delete their own certificates"
    ON public.certificates FOR DELETE
    USING (auth.uid() = user_id);

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS handle_certificates_updated_at ON public.certificates;
DROP FUNCTION IF EXISTS public.handle_certificates_updated_at CASCADE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER handle_certificates_updated_at
    BEFORE UPDATE ON public.certificates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_certificates_updated_at();
