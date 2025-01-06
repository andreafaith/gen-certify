-- Check certificates table
SELECT 
    c.id,
    c.user_id,
    c.title,
    c.recipient_name,
    t.name as template_name,
    c.created_at
FROM 
    certificates c
    LEFT JOIN templates t ON c.template_id = t.id
ORDER BY 
    c.created_at DESC
LIMIT 5;
