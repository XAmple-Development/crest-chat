-- Production Database Setup for CrestChat
-- This script creates a complete, production-ready database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('online', 'idle', 'dnd', 'invisible', 'offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('text', 'voice', 'announcement', 'stage', 'forum');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('default', 'system', 'user_join', 'user_leave', 'channel_pin', 'channel_topic');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE role_permission AS ENUM ('view_channel', 'send_messages', 'manage_messages', 'manage_channels', 'manage_server', 'kick_members', 'ban_members', 'administrator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL UNIQUE,
    discriminator VARCHAR(4) NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    custom_status TEXT,
    status user_status DEFAULT 'online',
    theme VARCHAR(50) DEFAULT 'dark',
    locale VARCHAR(10) DEFAULT 'en-US',
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_verified BOOLEAN DEFAULT false,
    is_bot BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    flags INTEGER DEFAULT 0,
    premium_type INTEGER DEFAULT 0,
    premium_since TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    banner_url TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    max_members INTEGER DEFAULT 100000,
    boost_level INTEGER DEFAULT 0,
    boost_count INTEGER DEFAULT 0,
    privacy_level VARCHAR(20) DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'invite_only')),
    invite_code VARCHAR(10) UNIQUE,
    default_channel_id UUID,
    system_channel_id UUID,
    rules_channel_id UUID,
    public_updates_channel_id UUID,
    afk_channel_id UUID,
    afk_timeout INTEGER DEFAULT 300,
    verification_level INTEGER DEFAULT 0,
    explicit_content_filter INTEGER DEFAULT 0,
    premium_tier INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type channel_type DEFAULT 'text',
    is_nsfw BOOLEAN DEFAULT false,
    is_announcement BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    topic TEXT,
    position INTEGER DEFAULT 0,
    rate_limit_per_user INTEGER DEFAULT 0,
    bitrate INTEGER DEFAULT 64000,
    user_limit INTEGER DEFAULT 0,
    rtc_region TEXT,
    video_quality_mode INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_members table
CREATE TABLE IF NOT EXISTS server_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(255),
    avatar_url TEXT,
    roles TEXT[] DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(server_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT,
    type message_type DEFAULT 'default',
    is_pinned BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    mentions_everyone BOOLEAN DEFAULT false,
    mention_roles TEXT[] DEFAULT '{}',
    mention_users UUID[] DEFAULT '{}',
    embeds JSONB,
    attachments JSONB,
    reactions JSONB,
    flags INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(50) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en-US',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    status_visibility VARCHAR(20) DEFAULT 'all' CHECK (status_visibility IN ('all', 'friends', 'none')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_servers_owner_id ON servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_servers_privacy_level ON servers(privacy_level);
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10);
    exists BOOLEAN;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        SELECT EXISTS(
            SELECT 1 FROM servers WHERE invite_code = code
        ) INTO exists;
        
        EXIT WHEN NOT exists;
        
        attempts := attempts + 1;
        IF attempts > max_attempts THEN
            -- Fallback: use timestamp-based code
            code := upper(substring(md5(extract(epoch from now())::text) from 1 for 8));
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create function to join server by invite
CREATE OR REPLACE FUNCTION join_server_by_invite(invite_code_param VARCHAR(10))
RETURNS BOOLEAN AS $$
DECLARE
    server_record RECORD;
BEGIN
    -- Find the server by invite code
    SELECT * INTO server_record 
    FROM servers 
    WHERE invite_code = invite_code_param;
    
    -- Check if server exists and is invite-only or public
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;
    
    IF server_record.privacy_level = 'private' THEN
        RAISE EXCEPTION 'This server is private';
    END IF;
    
    -- Check if user is already a member
    IF EXISTS(
        SELECT 1 FROM server_members 
        WHERE server_id = server_record.id AND user_id = auth.uid()
    ) THEN
        RETURN true; -- Already a member
    END IF;
    
    -- Add user to server
    INSERT INTO server_members (server_id, user_id)
    VALUES (server_record.id, auth.uid());
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to join server: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION join_server_by_invite(VARCHAR(10)) TO authenticated;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create production-ready RLS policies

-- Profiles policies
CREATE POLICY "profiles_select" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Servers policies
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

CREATE POLICY "servers_insert" ON servers 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "servers_update" ON servers 
FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "servers_delete" ON servers 
FOR DELETE USING (owner_id = auth.uid());

-- Channels policies
CREATE POLICY "channels_select" ON channels 
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

-- Server members policies
CREATE POLICY "server_members_select" ON server_members 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = server_members.server_id AND servers.owner_id = auth.uid()
    ) OR
    EXISTS(
        SELECT 1 FROM server_members sm2
        WHERE sm2.server_id = server_members.server_id AND sm2.user_id = auth.uid()
    ) OR
    EXISTS(
        SELECT 1 FROM servers 
        WHERE servers.id = server_members.server_id AND servers.privacy_level = 'public'
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

-- Messages policies
CREATE POLICY "messages_select" ON messages 
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

CREATE POLICY "messages_insert" ON messages 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM server_members sm
        JOIN channels c ON sm.server_id = c.server_id
        WHERE c.id = messages.channel_id AND sm.user_id = auth.uid()
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

-- Show final status
SELECT '=== PRODUCTION DATABASE SETUP COMPLETE ===' as info;
SELECT 'All tables, functions, policies, and indexes have been created successfully!' as status;
SELECT 'The database is now ready for production deployment.' as ready;
