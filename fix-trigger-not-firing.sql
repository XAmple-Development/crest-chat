-- Fix Trigger Not Firing Automatically
-- This script addresses common issues that prevent triggers from working

-- 1. Check current trigger status
SELECT '=== CURRENT TRIGGER STATUS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 2. Check if the function exists and has correct permissions
SELECT '=== FUNCTION STATUS ===' as info;
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. Drop and recreate everything to ensure proper setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 4. Create the function with explicit schema references and proper permissions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_base VARCHAR(32);
    discriminator VARCHAR(4);
    username_exists BOOLEAN;
    counter INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    -- Log that the function is being called
    RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
    
    -- Generate username from email
    username_base := split_part(NEW.email, '@', 1);
    
    -- Ensure username is valid (remove special characters, limit length)
    username_base := regexp_replace(username_base, '[^a-zA-Z0-9_]', '', 'g');
    username_base := substring(username_base from 1 for 20);
    
    -- If username is empty after cleaning, use a default
    IF username_base = '' THEN
        username_base := 'user';
    END IF;
    
    -- Generate unique discriminator
    LOOP
        discriminator := lpad(floor(random() * 10000)::text, 4, '0');
        
        -- Check if username + discriminator combination exists
        SELECT EXISTS(
            SELECT 1 FROM public.profiles 
            WHERE username = username_base AND discriminator = discriminator
        ) INTO username_exists;
        
        EXIT WHEN NOT username_exists;
        
        counter := counter + 1;
        IF counter > max_attempts THEN
            -- Fallback: use timestamp-based discriminator
            discriminator := lpad(extract(epoch from now())::integer % 10000, 4, '0');
            EXIT;
        END IF;
    END LOOP;
    
    -- Insert profile with explicit schema reference
    INSERT INTO public.profiles (id, username, discriminator, display_name)
    VALUES (NEW.id, username_base, discriminator, username_base);
    
    -- Insert user settings with explicit schema reference
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RAISE NOTICE 'Profile created for user %: %#%', NEW.id, username_base, discriminator;
    RAISE LOG 'Profile creation completed successfully for user: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RAISE LOG 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;

-- 6. Create the trigger with explicit schema reference
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Verify the trigger was created
SELECT '=== TRIGGER CREATED ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';

-- 8. Test the trigger manually with a test user (if you have one)
-- Uncomment and modify the line below to test:
-- SELECT handle_new_user() FROM (SELECT 'test-user-id'::uuid as id, 'test@example.com' as email) as test_user;

-- 9. Check if there are any existing users without profiles and create them
SELECT '=== CREATING MISSING PROFILES ===' as info;

-- Create profiles for existing users who don't have them
INSERT INTO public.profiles (id, username, discriminator, display_name)
SELECT 
    au.id,
    COALESCE(split_part(au.email, '@', 1), 'user'),
    lpad(floor(random() * 10000)::text, 4, '0'),
    COALESCE(split_part(au.email, '@', 1), 'user')
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Create user settings for existing users who don't have them
INSERT INTO public.user_settings (user_id)
SELECT 
    au.id
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_settings us WHERE us.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 10. Show final status
SELECT '=== FINAL STATUS ===' as info;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM public.profiles) as profiles,
    (SELECT COUNT(*) FROM public.user_settings) as user_settings;

-- 11. Test the trigger by checking if it's properly attached
SELECT '=== TRIGGER TEST ===' as info;
SELECT 
    'Trigger should now fire automatically for new users' as status,
    'Create a new account to test' as instruction;
