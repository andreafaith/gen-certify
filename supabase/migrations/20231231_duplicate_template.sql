-- Function to duplicate a template
CREATE OR REPLACE FUNCTION public.duplicate_template(
    template_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_template_id UUID;
    original_name TEXT;
    original_description TEXT;
BEGIN
    -- Get original template details
    SELECT name, description 
    INTO original_name, original_description
    FROM templates 
    WHERE id = template_id;

    -- Create new template as a copy
    INSERT INTO templates (
        name,
        description,
        created_at,
        updated_at,
        user_id
    )
    SELECT 
        original_name || ' (Copy)',
        original_description,
        NOW(),
        NOW(),
        auth.uid()
    FROM templates
    WHERE id = template_id
    RETURNING id INTO new_template_id;

    -- Log the duplication action
    INSERT INTO activity_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        auth.uid(),
        'duplicate',
        'template',
        new_template_id,
        jsonb_build_object(
            'original_template_id', template_id,
            'new_template_id', new_template_id,
            'new_name', original_name || ' (Copy)'
        )
    );

    RETURN new_template_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.duplicate_template TO authenticated;

-- RLS Policy for templates
CREATE POLICY "Users can duplicate templates they have access to"
    ON templates FOR ALL
    USING (
        -- Allow if user owns the template
        auth.uid() = user_id
    );
