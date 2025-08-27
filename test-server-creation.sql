-- Test Server Creation Without Recursion
-- This script tests the server creation process to ensure no recursion issues

-- First, let's check if we have any users
SELECT '=== CHECKING FOR USERS ===' as info;
SELECT 
    id,
    email,
    created_at
FROM auth.users 
LIMIT 5;

-- Check if we have any profiles
SELECT '=== CHECKING FOR PROFILES ===' as info;
SELECT 
    id,
    username,
    display_name,
    created_at
FROM profiles 
LIMIT 5;

-- Check current server count
SELECT '=== CURRENT SERVERS ===' as info;
SELECT 
    COUNT(*) as total_servers,
    COUNT(CASE WHEN privacy_level = 'public' THEN 1 END) as public_servers,
    COUNT(CASE WHEN privacy_level = 'private' THEN 1 END) as private_servers,
    COUNT(CASE WHEN privacy_level = 'invite_only' THEN 1 END) as invite_only_servers
FROM servers;

-- Check RLS policies for servers table
SELECT '=== SERVER RLS POLICIES ===' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'servers'
ORDER BY policyname;

-- Test manual server creation (this should work without recursion)
SELECT '=== TESTING MANUAL SERVER CREATION ===' as info;

-- Get a test user ID (replace with actual user ID if needed)
DO $$
DECLARE
    test_user_id UUID;
    new_server_id UUID;
    new_channel_id UUID;
BEGIN
    -- Get the first user (or you can replace with a specific user ID)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with user ID: %', test_user_id;
    
    -- Create a test server
    INSERT INTO servers (
        name,
        description,
        owner_id,
        privacy_level,
        invite_code,
        is_public
    ) VALUES (
        'Test Server',
        'A test server to verify no recursion issues',
        test_user_id,
        'public',
        upper(substring(md5(random()::text) from 1 for 8)),
        true
    ) RETURNING id INTO new_server_id;
    
    RAISE NOTICE 'Server created successfully with ID: %', new_server_id;
    
    -- Create a test channel
    INSERT INTO channels (
        server_id,
        name,
        type,
        position
    ) VALUES (
        new_server_id,
        'general',
        'text',
        0
    ) RETURNING id INTO new_channel_id;
    
    RAISE NOTICE 'Channel created successfully with ID: %', new_channel_id;
    
    -- Add user as member (this should work without recursion)
    INSERT INTO server_members (
        server_id,
        user_id
    ) VALUES (
        new_server_id,
        test_user_id
    );
    
    RAISE NOTICE 'User added as member successfully';
    
    -- Clean up test data
    DELETE FROM server_members WHERE server_id = new_server_id;
    DELETE FROM channels WHERE server_id = new_server_id;
    DELETE FROM servers WHERE id = new_server_id;
    
    RAISE NOTICE 'Test completed successfully - no recursion issues detected!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during test: %', SQLERRM;
        -- Clean up on error
        IF new_server_id IS NOT NULL THEN
            DELETE FROM server_members WHERE server_id = new_server_id;
            DELETE FROM channels WHERE server_id = new_server_id;
            DELETE FROM servers WHERE id = new_server_id;
        END IF;
END $$;

-- Show final status
SELECT '=== FINAL STATUS ===' as info;
SELECT 'Server creation test completed. Check the logs above for any errors.' as status;
