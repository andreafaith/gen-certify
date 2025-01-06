-- Check table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'certificates'
ORDER BY 
    ordinal_position;

-- Check status constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'certificates'::regclass
    AND contype = 'c';

-- Check if trigger function exists
SELECT 
    proname,
    prosrc
FROM 
    pg_proc
WHERE 
    proname = 'handle_certificates_updated_at';
