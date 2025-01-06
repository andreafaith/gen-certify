-- Check if the certificate exists
SELECT 
    c.id as certificate_id,
    c.user_id,
    c.template_id,
    c.title,
    c.recipient_name,
    c.status,
    t.name as template_name,
    t.design_data as template_data
FROM 
    certificates c
    LEFT JOIN templates t ON c.template_id = t.id
WHERE 
    c.id = '410814d5-a471-4c25-b0fc-e5737370f613'::uuid;
