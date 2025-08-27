-- Test Member Loading Functionality
-- This script tests the member loading to ensure it works properly

-- First, let's see what servers and members we have
SELECT '=== CURRENT SERVERS AND MEMBERS ===' as info;
SELECT 
    s.id as server_id,
    s.name as server_name,
    s.owner_id,
    s.privacy_level,
    COUNT(sm.user_id) as member_count
FROM servers s
LEFT JOIN server_members sm ON s.id = sm.server_id
GROUP BY s.id, s.name, s.owner_id, s.privacy_level
ORDER BY s.created_at DESC;

-- Show detailed member information
SELECT '=== DETAILED MEMBER INFORMATION ===' as info;
SELECT 
    s.name as server_name,
    sm.user_id,
    p.username,
    p.display_name,
    p.status,
    sm.joined_at,
    CASE 
        WHEN s.owner_id = sm.user_id THEN 'Owner'
        ELSE 'Member'
    END as role
FROM servers s
JOIN server_members sm ON s.id = sm.server_id
LEFT JOIN profiles p ON sm.user_id = p.id
ORDER BY s.name, sm.joined_at;

-- Test the exact query that the frontend uses
SELECT '=== TESTING FRONTEND QUERY ===' as info;

-- Get a sample server ID
DO $$
DECLARE
    sample_server_id UUID;
    member_count INTEGER;
BEGIN
    -- Get a server that has members
    SELECT s.id INTO sample_server_id 
    FROM servers s 
    JOIN server_members sm ON s.id = sm.server_id 
    LIMIT 1;
    
    IF sample_server_id IS NULL THEN
        RAISE NOTICE 'No servers with members found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing member loading for server ID: %', sample_server_id;
    
    -- Test the exact query the frontend uses
    SELECT COUNT(*) INTO member_count
    FROM server_members sm
    WHERE sm.server_id = sample_server_id;
    
    RAISE NOTICE 'Found % members for this server', member_count;
    
    -- Show the members
    RAISE NOTICE 'Members:';
    FOR member_record IN 
        SELECT 
            sm.user_id,
            p.username,
            p.display_name
        FROM server_members sm
        LEFT JOIN profiles p ON sm.user_id = p.id
        WHERE sm.server_id = sample_server_id
    LOOP
        RAISE NOTICE '  User: % (%), Display: %', 
            member_record.user_id, 
            member_record.username, 
            member_record.display_name;
    END LOOP;
    
END $$;

-- Check RLS policies for server_members
SELECT '=== SERVER_MEMBERS RLS POLICIES ===' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'server_members'
ORDER BY policyname;

-- Test if we can query server_members directly
SELECT '=== DIRECT SERVER_MEMBERS QUERY ===' as info;
SELECT 
    server_id,
    user_id,
    joined_at
FROM server_members 
LIMIT 10;
