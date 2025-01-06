-- Ensure profiles table exists with user_role column
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    user_role text not null default 'user',
    status text not null default 'active',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Add RLS to profiles if not exists
alter table public.profiles enable row level security;

-- Create profiles policies if not exists
create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Create helper function for admin check
create or replace function is_admin()
returns boolean as $$
begin
  return (
    select count(*) > 0
    from auth.users u
    inner join profiles p on p.id = u.id
    where u.id = auth.uid()
    and p.user_role in ('admin', 'super_admin')
  );
end;
$$ language plpgsql security definer;

-- Create field_templates table
create table if not exists public.field_templates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    display_name text not null,
    field_type text not null check (field_type in ('text', 'date', 'number', 'select', 'multi-select')),
    options jsonb,
    default_value text,
    validation_rules jsonb,
    category text,
    description text,
    is_required boolean default false,
    is_system boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Add RLS policies
alter table public.field_templates enable row level security;

-- Policies for field_templates
create policy "Field templates are viewable by authenticated users"
    on public.field_templates for select
    using (auth.role() = 'authenticated');

create policy "Field templates are editable by admins"
    on public.field_templates for all
    using (is_admin());

-- Insert default field templates
insert into public.field_templates (name, display_name, field_type, options, default_value, validation_rules, category, description, is_required, is_system) values
    -- Personal Information
    ('recipient_name', 'Recipient Name', 'text', null, null, 
     '{"min_length": 2, "max_length": 100}',
     'personal', 'Full name of the certificate recipient', true, true),
    
    ('recipient_title', 'Title', 'select', 
     '["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."]',
     'Mr.', null,
     'personal', 'Title or honorific of the recipient', false, false),
    
    ('recipient_email', 'Email', 'text', null, null,
     '{"pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"}',
     'personal', 'Email address of the recipient', false, false),

    -- Course/Achievement Information
    ('course_name', 'Course Name', 'text', null, null,
     '{"min_length": 2, "max_length": 200}',
     'course', 'Name of the completed course', true, true),
    
    ('course_level', 'Course Level', 'select',
     '["Beginner", "Intermediate", "Advanced", "Expert"]',
     'Beginner', null,
     'course', 'Difficulty level of the course', false, false),
    
    ('completion_status', 'Completion Status', 'select',
     '["Completed", "Passed with Distinction", "Passed with Merit", "Passed"]',
     'Completed', null,
     'course', 'Status of course completion', false, false),

    -- Dates
    ('issue_date', 'Issue Date', 'date', null, null,
     '{"format": "YYYY-MM-DD"}',
     'dates', 'Date when the certificate was issued', true, true),
    
    ('expiry_date', 'Expiry Date', 'date', null, null,
     '{"format": "YYYY-MM-DD"}',
     'dates', 'Date when the certificate expires (if applicable)', false, false),
    
    ('completion_date', 'Completion Date', 'date', null, null,
     '{"format": "YYYY-MM-DD"}',
     'dates', 'Date when the course was completed', false, false),

    -- Grades/Scores
    ('grade', 'Grade', 'select',
     '["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]',
     null, null,
     'performance', 'Final grade achieved', false, false),
    
    ('score', 'Score', 'number', null, null,
     '{"min": 0, "max": 100}',
     'performance', 'Numerical score achieved', false, false),
    
    ('percentile', 'Percentile', 'number', null, null,
     '{"min": 0, "max": 100}',
     'performance', 'Performance percentile in the class', false, false),

    -- Certification Details
    ('certificate_id', 'Certificate ID', 'text', null, null,
     '{"pattern": "^[A-Z0-9-]+$"}',
     'certification', 'Unique identifier for the certificate', true, true),
    
    ('certification_type', 'Certification Type', 'select',
     '["Professional", "Academic", "Participation", "Achievement", "Completion"]',
     'Completion', null,
     'certification', 'Type of certification awarded', false, false),
    
    ('accreditation_body', 'Accreditation Body', 'text', null, null,
     '{"min_length": 2, "max_length": 200}',
     'certification', 'Organization providing accreditation', false, false),

    -- Additional Information
    ('duration_hours', 'Duration (Hours)', 'number', null, null,
     '{"min": 0, "max": 10000}',
     'additional', 'Duration of the course in hours', false, false),
    
    ('credits_earned', 'Credits Earned', 'number', null, null,
     '{"min": 0, "max": 100}',
     'additional', 'Number of credits earned', false, false),
    
    ('special_honors', 'Special Honors', 'multi-select',
     '["Summa Cum Laude", "Magna Cum Laude", "Cum Laude", "With Honors", "With Distinction"]',
     null, null,
     'additional', 'Special honors or distinctions awarded', false, false)
ON CONFLICT (id) DO NOTHING;

-- Create certificate_fields table to store the actual field values
create table if not exists public.certificate_fields (
    id uuid primary key default gen_random_uuid(),
    certificate_id uuid references public.certificates(id) on delete cascade,
    template_id uuid references public.field_templates(id),
    value text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(certificate_id, template_id)
);

-- Add RLS policies
alter table public.certificate_fields enable row level security;

-- Policies for certificate_fields
create policy "Certificate fields are viewable by certificate owner"
    on public.certificate_fields for select
    using (
        exists (
            select 1 from public.certificates c
            where c.id = certificate_id
            and c.user_id = auth.uid()
        )
    );

create policy "Certificate fields are editable by certificate owner"
    on public.certificate_fields for all
    using (
        exists (
            select 1 from public.certificates c
            where c.id = certificate_id
            and c.user_id = auth.uid()
        )
    );

-- Function to get field templates by category
create or replace function get_field_templates_by_category(p_category text)
returns setof field_templates as $$
begin
    return query
    select *
    from public.field_templates
    where category = p_category
    order by display_name;
end;
$$ language plpgsql security definer;

-- Function to validate field value against template rules
create or replace function validate_field_value(
    p_template_id uuid,
    p_value text
) returns boolean as $$
declare
    v_template field_templates%rowtype;
    v_rules jsonb;
    v_options jsonb;
begin
    -- Get the template
    select * into v_template
    from public.field_templates
    where id = p_template_id;

    if not found then
        return false;
    end if;

    -- Get validation rules and options
    v_rules := v_template.validation_rules;
    v_options := v_template.options;

    -- Check if required field is empty
    if v_template.is_required and (p_value is null or p_value = '') then
        return false;
    end if;

    -- Validate based on field type
    case v_template.field_type
        when 'text' then
            if v_rules is not null then
                -- Check min length
                if v_rules->>'min_length' is not null and 
                   length(p_value) < (v_rules->>'min_length')::int then
                    return false;
                end if;
                -- Check max length
                if v_rules->>'max_length' is not null and 
                   length(p_value) > (v_rules->>'max_length')::int then
                    return false;
                end if;
                -- Check pattern
                if v_rules->>'pattern' is not null and 
                   p_value !~ (v_rules->>'pattern') then
                    return false;
                end if;
            end if;

        when 'number' then
            if not p_value ~ '^[0-9]+(\.[0-9]+)?$' then
                return false;
            end if;
            if v_rules is not null then
                -- Check min value
                if v_rules->>'min' is not null and 
                   p_value::numeric < (v_rules->>'min')::numeric then
                    return false;
                end if;
                -- Check max value
                if v_rules->>'max' is not null and 
                   p_value::numeric > (v_rules->>'max')::numeric then
                    return false;
                end if;
            end if;

        when 'date' then
            if not p_value ~ '^\d{4}-\d{2}-\d{2}$' then
                return false;
            end if;

        when 'select' then
            if v_options is not null and 
               not v_options @> to_jsonb(p_value) then
                return false;
            end if;

        when 'multi-select' then
            if v_options is not null then
                -- Check if all selected values are in the options list
                if not (
                    select bool_and(val::text in (
                        select jsonb_array_elements_text(v_options)
                    ))
                    from jsonb_array_elements(p_value::jsonb) as val
                ) then
                    return false;
                end if;
            end if;
    end case;

    return true;
end;
$$ language plpgsql security definer;

-- Create system performance table
create table if not exists public.system_performance (
    id uuid primary key default gen_random_uuid(),
    metric_name text not null,
    metric_value numeric not null,
    timestamp timestamptz default now()
);

-- Create API logs table
create table if not exists public.api_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade,
    endpoint text not null,
    method text not null,
    status_code integer not null,
    response_time numeric not null,
    timestamp timestamptz default now()
);

-- Create error logs table
create table if not exists public.error_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade,
    error_message text not null,
    error_stack text,
    context jsonb,
    timestamp timestamptz default now()
);

-- Create activity logs table
create table if not exists public.activity_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade,
    action text not null,
    details jsonb,
    timestamp timestamptz default now()
);

-- Enable RLS on all log tables
alter table public.system_performance enable row level security;
alter table public.api_logs enable row level security;
alter table public.error_logs enable row level security;
alter table public.activity_logs enable row level security;

-- System performance policies
create policy "System performance viewable by admins"
    on public.system_performance for select
    using (is_admin());

-- API logs policies
create policy "API logs viewable by admins"
    on public.api_logs for select
    using (is_admin());

create policy "Users can view their own API logs"
    on public.api_logs for select
    using (auth.uid() = user_id);

-- Error logs policies
create policy "Error logs viewable by admins"
    on public.error_logs for select
    using (is_admin());

create policy "Users can view their own error logs"
    on public.error_logs for select
    using (auth.uid() = user_id);

-- Activity logs policies
create policy "Activity logs viewable by admins"
    on public.activity_logs for select
    using (is_admin());

create policy "Users can view their own activity logs"
    on public.activity_logs for select
    using (auth.uid() = user_id);

-- Create templates table
create table if not exists public.templates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    is_global boolean default false,
    properties jsonb,
    elements jsonb
);

-- Insert global template for IBM-style certificates
INSERT INTO public.templates (
    name,
    description,
    is_global,
    properties,
    elements
) VALUES (
    'Corporate Certificate Template',
    'A professional certificate template suitable for corporate use',
    true,
    jsonb_build_object(
        'size', jsonb_build_object(
            'width', 800,
            'height', 1100,
            'unit', 'px'
        ),
        'orientation', 'portrait',
        'background', jsonb_build_object(
            'type', 'color',
            'value', '#FFFFFF'
        ),
        'margins', jsonb_build_object(
            'top', 40,
            'right', 40,
            'bottom', 40,
            'left', 40,
            'unit', 'px'
        ),
        'padding', jsonb_build_object(
            'top', 20,
            'right', 20,
            'bottom', 20,
            'left', 20,
            'unit', 'px'
        )
    ),
    jsonb_build_array(
        -- Company Logo
        jsonb_build_object(
            'id', gen_random_uuid(),
            'type', 'image',
            'content', '{{company.logo}}',
            'position', jsonb_build_object('x', 85, 'y', 15),
            'style', jsonb_build_object(
                'maxWidth', '200px',
                'maxHeight', '80px'
            )
        ),
        -- Company Address
        jsonb_build_object(
            'id', gen_random_uuid(),
            'type', 'text',
            'content', '{{company.name}}\n{{company.address_line1}}\n{{company.address_line2}}\n{{company.city}}, {{company.country}} {{company.postal_code}}',
            'position', jsonb_build_object('x', 85, 'y', 25),
            'style', jsonb_build_object(
                'fontSize', '12px',
                'textAlign', 'right',
                'fontFamily', 'Arial, sans-serif',
                'color', '#333333',
                'whiteSpace', 'pre-line'
            )
        ),
        -- Certificate Title
        jsonb_build_object(
            'id', gen_random_uuid(),
            'type', 'text',
            'content', 'Certificate',
            'position', jsonb_build_object('x', 50, 'y', 40),
            'style', jsonb_build_object(
                'fontSize', '36px',
                'fontWeight', 'bold',
                'textAlign', 'center',
                'fontFamily', 'Arial, sans-serif',
                'color', '#000000'
            )
        ),
        -- Certificate Body
        jsonb_build_object(
            'id', gen_random_uuid(),
            'type', 'text',
            'content', '{{company.name}} with office address at {{company.address_line1}}, {{company.address_line2}} is an affiliate of {{company.parent_company}} in {{company.parent_location}}, owner of proprietary rights to {{company.products}}, {{company.subsidiary_name}} is the sole distributor to distribute {{company.product_line}} in {{company.region}}.',
            'position', jsonb_build_object('x', 50, 'y', 55),
            'style', jsonb_build_object(
                'fontSize', '14px',
                'textAlign', 'justify',
                'fontFamily', 'Arial, sans-serif',
                'color', '#333333',
                'maxWidth', '600px',
                'lineHeight', '1.5'
            )
        ),
        -- Partner Details
        jsonb_build_object(
            'id', gen_random_uuid(),
            'type', 'text',
            'content', '{{company.name}} do hereby certify that {{partner.name}} with office address at {{partner.address}} is a {{partner.level}} Authorized {{company.name}} Business Partner and authorized to supply/deliver/sell for {{product.name}}, for and its own behalf, for the licenses subject to applicable {{company.name}} standard end user licensing terms and conditions.',
            'position', jsonb_build_object('x', 50, 'y', 70),
            'style', jsonb_build_object(
                'fontSize', '14px',
                'textAlign', 'justify',
                'fontFamily', 'Arial, sans-serif',
                'color', '#333333',
                'maxWidth', '600px',
                'lineHeight', '1.5'
            )
        ),
        -- Contact Information
        jsonb_build_object(
            'id', gen_random_uuid(),
            'type', 'text',
            'content', 'For inquiries regarding this certification, you may contact {{contact.name}} thru email ({{contact.email}}).',
            'position', jsonb_build_object('x', 50, 'y', 85),
            'style', jsonb_build_object(
                'fontSize', '12px',
                'textAlign', 'left',
                'fontFamily', 'Arial, sans-serif',
                'color', '#666666'
            )
        ),
        -- Validity
        jsonb_build_object(
            'id', gen_random_uuid(),
            'type', 'text',
            'content', 'This certification is valid until {{certificate.valid_until}}.',
            'position', jsonb_build_object('x', 50, 'y', 90),
            'style', jsonb_build_object(
                'fontSize', '12px',
                'textAlign', 'left',
                'fontFamily', 'Arial, sans-serif',
                'color', '#666666'
            )
        )
    )
);

-- Function to duplicate a template
CREATE OR REPLACE FUNCTION duplicate_template(
    template_id UUID,
    new_name TEXT DEFAULT NULL,
    new_description TEXT DEFAULT NULL
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

    -- Set new name and description if not provided
    new_name := COALESCE(new_name, original_name || ' (Copy)');
    new_description := COALESCE(new_description, original_description);

    -- Create new template as a copy
    INSERT INTO templates (
        name,
        description,
        is_global,
        properties,
        elements,
        created_at,
        updated_at,
        user_id
    )
    SELECT 
        new_name,
        new_description,
        is_global,
        properties,
        elements,
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
            'new_name', new_name
        )
    );

    RETURN new_template_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION duplicate_template TO authenticated;

-- RLS Policy for duplicate_template function
CREATE POLICY "Users can duplicate templates they have access to"
    ON templates FOR ALL
    USING (
        -- Allow if user owns the template
        auth.uid() = user_id
        OR 
        -- Allow if template is global
        is_global = true
    );
