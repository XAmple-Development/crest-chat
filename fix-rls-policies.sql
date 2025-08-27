-- Fix RLS Policies to Prevent Infinite Recursion
-- This script fixes the circular dependency issues in the RLS policies

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Public servers are visible to everyone" ON servers;
DROP POLICY IF EXISTS "Server owners can update server" ON servers;
DROP POLICY IF EXISTS "Authenticated users can create servers" ON servers;

DROP POLICY IF EXISTS "Public server channels are visible to everyone" ON channels;
DROP POLICY IF EXISTS "Server members can create channels" ON channels;
DROP POLICY IF EXISTS "Server owners can update channels" ON channels;
DROP POLICY IF EXISTS "Server owners can delete channels" ON channels;

DROP POLICY IF EXISTS "Users can view server members" ON server_members;
DROP POLICY IF EXISTS "Users can join servers" ON server_members;
DROP POLICY IF EXISTS "Server owners can remove members" ON server_members;

DROP POLICY IF EXISTS "Public server messages are visible to everyone" ON messages;
DROP POLICY IF EXISTS "Server members can send messages" ON messages;
DROP POLICY IF EXISTS "Users can edit own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

-- Create simplified policies for servers
CREATE POLICY "servers_select_policy" ON servers 
FOR SELECT USING (
    privacy_level = 'public' OR 
    privacy_level = 'invite_only' OR
    owner_id = auth.uid() OR
    EXISTS(
        SELECT 1 FROM server_members 
        WHERE server_id = servers.id AND user_id = auth.uid()
    )
);

CREATE POLICY "servers_insert_policy" ON servers 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "servers_update_policy" ON servers 
FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "servers_delete_policy" ON servers 
FOR DELETE USING (owner_id = auth.uid());

-- Create simplified policies for channels
CREATE POLICY "channels_select_policy" ON channels 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = channels.server_id 
        AND (servers.privacy_level = 'public' OR servers.privacy_level = 'invite_only')
    ) OR
    EXISTS(
        SELECT 1 FROM server_members 
        WHERE server_id = channels.server_id AND user_id = auth.uid()
    )
);

CREATE POLICY "channels_insert_policy" ON channels 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM server_members 
        WHERE server_id = channels.server_id AND user_id = auth.uid()
    )
);

CREATE POLICY "channels_update_policy" ON channels 
FOR UPDATE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = channels.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "channels_delete_policy" ON channels 
FOR DELETE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = channels.server_id AND servers.owner_id = auth.uid()
    )
);

-- Create simplified policies for server_members
CREATE POLICY "server_members_select_policy" ON server_members 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = server_members.server_id 
        AND servers.privacy_level = 'public'
    ) OR
    EXISTS(
        SELECT 1 FROM server_members sm2
        WHERE sm2.server_id = server_members.server_id AND sm2.user_id = auth.uid()
    )
);

CREATE POLICY "server_members_insert_policy" ON server_members 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "server_members_delete_policy" ON server_members 
FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = server_members.server_id AND servers.owner_id = auth.uid()
    )
);

-- Create simplified policies for messages
CREATE POLICY "messages_select_policy" ON messages 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM channels c
        JOIN servers s ON c.server_id = s.id
        WHERE c.id = messages.channel_id 
        AND (s.privacy_level = 'public' OR s.privacy_level = 'invite_only')
    ) OR
    EXISTS(
        SELECT 1 FROM server_members sm
        JOIN channels c ON sm.server_id = c.server_id
        WHERE c.id = messages.channel_id AND sm.user_id = auth.uid()
    )
);

CREATE POLICY "messages_insert_policy" ON messages 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM server_members sm
        JOIN channels c ON sm.server_id = c.server_id
        WHERE c.id = messages.channel_id AND sm.user_id = auth.uid()
    )
);

CREATE POLICY "messages_update_policy" ON messages 
FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "messages_delete_policy" ON messages 
FOR DELETE USING (auth.uid() = author_id);

-- Show the updated policies
SELECT '=== UPDATED RLS POLICIES ===' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('servers', 'channels', 'server_members', 'messages')
ORDER BY tablename, policyname;
