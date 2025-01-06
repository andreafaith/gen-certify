-- Add new columns to templates table
alter table public.templates
add column if not exists metadata jsonb default '{}'::jsonb,
add column if not exists document_type text,
add column if not exists storage_path text,
add column if not exists public_url text,
add column if not exists is_active boolean default true;

-- Add check constraint for document_type
alter table public.templates
add constraint templates_document_type_check 
check (document_type in ('pdf', 'docx', 'pptx'));

-- Update existing templates to be active
update public.templates
set is_active = true
where is_active is null;
