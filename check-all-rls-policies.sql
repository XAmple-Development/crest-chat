-- Check and Fix All RLS Policies
-- This script reviews and fixes all RLS policies to prevent recursion issues

-- First, let's see what policies currently exist
SELECT '=== CURRENT RLS POLICIES ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Drop all existing policies to start fresh
SELECT '=== DROPPING ALL EXISTING POLICIES ===' as info;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Servers policies
DROP POLICY IF EXISTS "Public servers are visible to everyone" ON servers;
DROP POLICY IF EXISTS "Server owners can update server" ON servers;
DROP POLICY IF EXISTS "Authenticated users can create servers" ON servers;
DROP POLICY IF EXISTS "servers_select_policy" ON servers;
DROP POLICY IF EXISTS "servers_insert_policy" ON servers;
DROP POLICY IF EXISTS "servers_update_policy" ON servers;
DROP POLICY IF EXISTS "servers_delete_policy" ON servers;

-- Channels policies
DROP POLICY IF EXISTS "Public server channels are visible to everyone" ON channels;
DROP POLICY IF EXISTS "Server members can create channels" ON channels;
DROP POLICY IF EXISTS "Server owners can update channels" ON channels;
DROP POLICY IF EXISTS "Server owners can delete channels" ON channels;
DROP POLICY IF EXISTS "channels_select_policy" ON channels;
DROP POLICY IF EXISTS "channels_insert_policy" ON channels;
DROP POLICY IF EXISTS "channels_update_policy" ON channels;
DROP POLICY IF EXISTS "channels_delete_policy" ON channels;

-- Server members policies
DROP POLICY IF EXISTS "Users can view server members" ON server_members;
DROP POLICY IF EXISTS "Users can join servers" ON server_members;
DROP POLICY IF EXISTS "Server owners can remove members" ON server_members;
DROP POLICY IF EXISTS "server_members_select_policy" ON server_members;
DROP POLICY IF EXISTS "server_members_insert_policy" ON server_members;
DROP POLICY IF EXISTS "server_members_delete_policy" ON server_members;

-- Messages policies
DROP POLICY IF EXISTS "Public server messages are visible to everyone" ON messages;
DROP POLICY IF EXISTS "Server members can send messages" ON messages;
DROP POLICY IF EXISTS "Users can edit own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

-- User settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

-- Now create simplified, non-recursive policies

-- Profiles policies (simple and safe)
CREATE POLICY "profiles_select" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Servers policies (simplified to avoid recursion)
CREATE POLICY "servers_select" ON servers 
FOR SELECT USING (
    privacy_level = 'public' OR 
    privacy_level = 'invite_only' OR
    owner_id = auth.uid()
);

CREATE POLICY "servers_insert" ON servers 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "servers_update" ON servers 
FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "servers_delete" ON servers 
FOR DELETE USING (owner_id = auth.uid());

-- Channels policies (simplified)
CREATE POLICY "channels_select" ON channels 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = channels.server_id 
        AND (servers.privacy_level = 'public' OR servers.privacy_level = 'invite_only')
    )
);

CREATE POLICY "channels_insert" ON channels 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = channels.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "channels_update" ON channels 
FOR UPDATE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = channels.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "channels_delete" ON channels 
FOR DELETE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = channels.server_id AND servers.owner_id = auth.uid()
    )
);

-- Server members policies (simplified)
CREATE POLICY "server_members_select" ON server_members 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = server_members.server_id 
        AND servers.privacy_level = 'public'
    )
);

CREATE POLICY "server_members_insert" ON server_members 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "server_members_delete" ON server_members 
FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = server_members.server_id AND servers.owner_id = auth.uid()
    )
);

-- Messages policies (simplified)
CREATE POLICY "messages_select" ON messages 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM channels c
        JOIN servers s ON c.server_id = s.id
        WHERE c.id = messages.channel_id 
        AND (s.privacy_level = 'public' OR s.privacy_level = 'invite_only')
    )
);

CREATE POLICY "messages_insert" ON messages 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM channels c
        JOIN servers s ON c.server_id = s.id
        WHERE c.id = messages.channel_id 
        AND s.owner_id = auth.uid()
    )
);

CREATE POLICY "messages_update" ON messages 
FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "messages_delete" ON messages 
FOR DELETE USING (auth.uid() = author_id);

-- User settings policies
CREATE POLICY "user_settings_select" ON user_settings 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_settings_insert" ON user_settings 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_settings_update" ON user_settings 
FOR UPDATE USING (auth.uid() = id);

-- Friendships policies
CREATE POLICY "friendships_select" ON friendships 
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friendships_insert" ON friendships 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "friendships_update" ON friendships 
FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friendships_delete" ON friendships 
FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Direct messages policies
CREATE POLICY "direct_messages_select" ON direct_messages 
FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "direct_messages_insert" ON direct_messages 
FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "direct_messages_update" ON direct_messages 
FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "direct_messages_delete" ON direct_messages 
FOR DELETE USING (auth.uid() = author_id);

-- DM channels policies
CREATE POLICY "dm_channels_select" ON dm_channels 
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "dm_channels_insert" ON dm_channels 
FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "dm_channels_delete" ON dm_channels 
FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Voice states policies
CREATE POLICY "voice_states_select" ON voice_states 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "voice_states_insert" ON voice_states 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "voice_states_update" ON voice_states 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "voice_states_delete" ON voice_states 
FOR DELETE USING (auth.uid() = user_id);

-- Invites policies
CREATE POLICY "invites_select" ON invites 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = invites.server_id 
        AND (servers.privacy_level = 'public' OR servers.privacy_level = 'invite_only')
    )
);

CREATE POLICY "invites_insert" ON invites 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = invites.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "invites_update" ON invites 
FOR UPDATE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = invites.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "invites_delete" ON invites 
FOR DELETE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = invites.server_id AND servers.owner_id = auth.uid()
    )
);

-- Audit logs policies
CREATE POLICY "audit_logs_select" ON audit_logs 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = audit_logs.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "audit_logs_insert" ON audit_logs 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = audit_logs.server_id AND servers.owner_id = auth.uid()
    )
);

-- Emojis policies
CREATE POLICY "emojis_select" ON emojis 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = emojis.server_id 
        AND (servers.privacy_level = 'public' OR servers.privacy_level = 'invite_only')
    )
);

CREATE POLICY "emojis_insert" ON emojis 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = emojis.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "emojis_update" ON emojis 
FOR UPDATE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = emojis.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "emojis_delete" ON emojis 
FOR DELETE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = emojis.server_id AND servers.owner_id = auth.uid()
    )
);

-- Stickers policies
CREATE POLICY "stickers_select" ON stickers 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = stickers.server_id 
        AND (servers.privacy_level = 'public' OR servers.privacy_level = 'invite_only')
    )
);

CREATE POLICY "stickers_insert" ON stickers 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = stickers.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "stickers_update" ON stickers 
FOR UPDATE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = stickers.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "stickers_delete" ON stickers 
FOR DELETE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = stickers.server_id AND servers.owner_id = auth.uid()
    )
);

-- Webhooks policies
CREATE POLICY "webhooks_select" ON webhooks 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = webhooks.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "webhooks_insert" ON webhooks 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = webhooks.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "webhooks_update" ON webhooks 
FOR UPDATE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = webhooks.server_id AND servers.owner_id = auth.uid()
    )
);

CREATE POLICY "webhooks_delete" ON webhooks 
FOR DELETE USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = webhooks.server_id AND servers.owner_id = auth.uid()
    )
);

-- Show final policy status
SELECT '=== FINAL RLS POLICIES STATUS ===' as info;
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Show tables with RLS enabled
SELECT '=== TABLES WITH RLS ENABLED ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;
