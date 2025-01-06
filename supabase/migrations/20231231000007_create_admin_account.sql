-- Create admin user if it doesn't exist
DO $$
DECLARE
    admin_uid UUID;
BEGIN
    -- Check if admin user exists
    SELECT id INTO admin_uid
    FROM auth.users
    WHERE email = 'admin@certificategenerator.com';

    -- If admin doesn't exist, create one
    IF admin_uid IS NULL THEN
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'admin',
            'admin@certificategenerator.com',
            crypt('Admin123!@#', gen_salt('bf')), -- Default password: Admin123!@#
            NOW(),
            NOW(),
            NOW(),
            jsonb_build_object(
                'provider', 'email',
                'providers', array['email'],
                'role', 'admin'
            ),
            jsonb_build_object(
                'role', 'admin'
            ),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO admin_uid;

        -- Set role and status
        UPDATE auth.users
        SET 
            role = 'admin',
            account_status = 'active'
        WHERE id = admin_uid;

        RAISE NOTICE 'Admin account created with email: admin@certificategenerator.com and password: Admin123!@#';
    ELSE
        -- Update existing admin to ensure they have admin role
        UPDATE auth.users
        SET 
            role = 'admin',
            account_status = 'active',
            raw_app_meta_data = jsonb_build_object(
                'provider', COALESCE((raw_app_meta_data->>'provider'), 'email'),
                'providers', COALESCE((raw_app_meta_data->'providers'), '["email"]'::jsonb),
                'role', 'admin'
            ),
            raw_user_meta_data = jsonb_build_object(
                'role', 'admin'
            )
        WHERE id = admin_uid;

        RAISE NOTICE 'Admin account already exists and has been updated with admin role';
    END IF;
END
$$;
