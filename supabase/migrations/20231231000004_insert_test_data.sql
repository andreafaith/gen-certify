-- First, make sure we have a template
INSERT INTO public.templates (id, name, design_data, created_at, updated_at)
SELECT 
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    'Test Template',
    jsonb_build_object(
        'width', 800,
        'height', 600,
        'elements', jsonb_build_array(
            jsonb_build_object(
                'type', 'text',
                'x', 400,
                'y', 300,
                'text', 'Certificate of Achievement',
                'fontSize', 32
            )
        )
    ),
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.templates WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid
);

-- Then insert a test certificate
INSERT INTO public.certificates (
    id,
    user_id,
    template_id,
    title,
    recipient_name,
    issue_date,
    status,
    created_at,
    updated_at
)
SELECT
    '410814d5-a471-4c25-b0fc-e5737370f613'::uuid,  -- Updated to match the requested ID
    '40b68d71-ee7c-4d43-90f2-eea37e1b56c1'::uuid,  -- Your user ID
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    'Test Certificate',
    'John Doe',
    now(),
    'draft',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.certificates WHERE id = '410814d5-a471-4c25-b0fc-e5737370f613'::uuid
);
