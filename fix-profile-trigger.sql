-- Fix Profile Creation Trigger
-- This script ensures new users get profiles created automatically

-- 1. First, let's check if the trigger exists
SELECT '=== CHECKING TRIGGER ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';

-- 2. Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create a more robust profile creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_base VARCHAR(32);
    discriminator VARCHAR(4);
    username_exists BOOLEAN;
    counter INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
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
    
    -- Insert profile
    INSERT INTO public.profiles (id, username, discriminator, display_name)
    VALUES (NEW.id, username_base, discriminator, username_base);
    
    -- Insert user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RAISE NOTICE 'Profile created for user %: %#%', NEW.id, username_base, discriminator;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Test the trigger by checking if it exists
SELECT '=== TRIGGER CREATED ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';

-- 6. Create profiles for existing users who don't have them
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

-- 7. Create user settings for existing users who don't have them
INSERT INTO public.user_settings (user_id)
SELECT 
    au.id
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_settings us WHERE us.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 8. Show the results
SELECT '=== EXISTING USERS FIXED ===' as info;
SELECT 
    COUNT(*) as total_users,
    (SELECT COUNT(*) FROM public.profiles) as profiles_created,
    (SELECT COUNT(*) FROM public.user_settings) as settings_created
FROM auth.users;

-- 9. Show all profiles
SELECT '=== ALL PROFILES ===' as info;
SELECT id, username, discriminator, display_name, created_at FROM public.profiles ORDER BY created_at DESC;
