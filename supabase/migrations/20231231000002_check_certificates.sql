-- Check table structure
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

-- Check constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM
    information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
WHERE
    tc.table_name = 'certificates';

-- Check indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'certificates';

-- Check RLS policies
SELECT
    pol.policyname,
    pol.cmd,
    pol.qual,
    pol.with_check
FROM
    pg_policies pol
WHERE
    pol.tablename = 'certificates';

-- Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'certificates';
