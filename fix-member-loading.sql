-- Fix Member Loading in Server Settings
-- This script fixes the RLS policies to allow proper member loading

-- First, let's check the current server_members policies
SELECT '=== CURRENT SERVER_MEMBERS POLICIES ===' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'server_members'
ORDER BY policyname;

-- Drop existing server_members policies
DROP POLICY IF EXISTS "server_members_select" ON server_members;
DROP POLICY IF EXISTS "server_members_insert" ON server_members;
DROP POLICY IF EXISTS "server_members_delete" ON server_members;

-- Create improved policies for server_members
CREATE POLICY "server_members_select" ON server_members 
FOR SELECT USING (
    -- Server owners can see all members
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = server_members.server_id AND servers.owner_id = auth.uid()
    ) OR
    -- Server members can see other members
    EXISTS(
        SELECT 1 FROM server_members sm2
        WHERE sm2.server_id = server_members.server_id AND sm2.user_id = auth.uid()
    ) OR
    -- Public servers show members to everyone
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = server_members.server_id AND servers.privacy_level = 'public'
    )
);

CREATE POLICY "server_members_insert" ON server_members 
FOR INSERT WITH CHECK (
    -- Users can join servers they have access to
    auth.uid() = user_id AND (
        -- Public servers
        EXISTS(
            SELECT 1 FROM servers 
            WHERE servers.id = server_members.server_id AND servers.privacy_level = 'public'
        ) OR
        -- Invite-only servers (assuming they have an invite)
        EXISTS(
            SELECT 1 FROM servers 
            WHERE servers.id = server_members.server_id AND servers.privacy_level = 'invite_only'
        ) OR
        -- Private servers (owner can add members)
        EXISTS(
            SELECT 1 FROM servers 
            WHERE servers.id = server_members.server_id AND servers.owner_id = auth.uid()
        )
    )
);

CREATE POLICY "server_members_delete" ON server_members 
FOR DELETE USING (
    -- Users can leave servers
    auth.uid() = user_id OR
    -- Server owners can remove members
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = server_members.server_id AND servers.owner_id = auth.uid()
    )
);

-- Also fix the servers policy to ensure server owners can see their servers
DROP POLICY IF EXISTS "servers_select" ON servers;
CREATE POLICY "servers_select" ON servers 
FOR SELECT USING (
    privacy_level = 'public' OR 
    privacy_level = 'invite_only' OR
    owner_id = auth.uid() OR
    EXISTS(
        SELECT 1 FROM server_members 
        WHERE server_id = servers.id AND user_id = auth.uid()
    )
);

-- Test the member loading functionality
SELECT '=== TESTING MEMBER LOADING ===' as info;

-- Show current servers and their member counts
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

-- Show sample members for each server
SELECT 
    s.name as server_name,
    sm.user_id,
    p.username,
    p.display_name,
    sm.joined_at
FROM servers s
JOIN server_members sm ON s.id = sm.server_id
LEFT JOIN profiles p ON sm.user_id = p.id
ORDER BY s.name, sm.joined_at;

-- Show the updated policies
SELECT '=== UPDATED SERVER_MEMBERS POLICIES ===' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'server_members'
ORDER BY policyname;
