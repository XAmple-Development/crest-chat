-- Debug Script for Server Visibility Issue
-- Run this in your Supabase SQL Editor to check what's happening

-- 1. Check if servers exist
SELECT '=== SERVERS ===' as info;
SELECT id, name, owner_id, created_at FROM servers ORDER BY created_at DESC;

-- 2. Check if server_members exist
SELECT '=== SERVER MEMBERS ===' as info;
SELECT id, server_id, user_id, joined_at FROM server_members ORDER BY joined_at DESC;

-- 3. Check if profiles exist
SELECT '=== PROFILES ===' as info;
SELECT id, username, discriminator, display_name FROM profiles ORDER BY created_at DESC;

-- 4. Check RLS policies
SELECT '=== RLS POLICIES ===' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('servers', 'server_members', 'profiles')
ORDER BY tablename, policyname;

-- 5. Check if user is authenticated and has a profile
SELECT '=== AUTH CHECK ===' as info;
SELECT 
    auth.uid() as current_user_id,
    (SELECT username FROM profiles WHERE id = auth.uid()) as profile_username,
    (SELECT COUNT(*) FROM server_members WHERE user_id = auth.uid()) as user_server_count;

-- 6. Test server creation manually (replace 'your-user-id' with actual user ID)
SELECT '=== MANUAL SERVER CREATION TEST ===' as info;
-- Uncomment and modify the line below with your actual user ID:
-- INSERT INTO servers (name, description, owner_id) VALUES ('Test Server', 'Debug test', 'your-user-id') RETURNING *;

-- 7. Check for any errors in recent operations
SELECT '=== RECENT ERRORS ===' as info;
-- This will show any recent database errors if they exist
