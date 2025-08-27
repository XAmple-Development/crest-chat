-- Complete Database Setup for CrestChat
-- This script creates all necessary tables, functions, and policies from scratch

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

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID,
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

-- Create dm_channels table
CREATE TABLE IF NOT EXISTS dm_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Create voice_states table
CREATE TABLE IF NOT EXISTS voice_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    deaf BOOLEAN DEFAULT false,
    mute BOOLEAN DEFAULT false,
    self_deaf BOOLEAN DEFAULT false,
    self_mute BOOLEAN DEFAULT false,
    self_video BOOLEAN DEFAULT false,
    self_stream BOOLEAN DEFAULT false,
    suppress BOOLEAN DEFAULT false,
    request_to_speak_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    max_uses INTEGER,
    max_age INTEGER,
    temporary BOOLEAN DEFAULT false,
    uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    changes JSONB,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create emojis table
CREATE TABLE IF NOT EXISTS emojis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stickers table
CREATE TABLE IF NOT EXISTS stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_voice_states_user_id ON voice_states(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_states_channel_id ON voice_states(channel_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_server_id ON invites(server_id);

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
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voice_states_updated_at BEFORE UPDATE ON voice_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for servers
CREATE POLICY "Public servers are visible to everyone" ON servers 
FOR SELECT USING (
    privacy_level = 'public' OR 
    privacy_level = 'invite_only' OR
    EXISTS(SELECT 1 FROM server_members WHERE server_id = id AND user_id = auth.uid())
);

CREATE POLICY "Server owners can update server" ON servers 
FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create servers" ON servers 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for channels
CREATE POLICY "Public server channels are visible to everyone" ON channels 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers s 
        WHERE s.id = server_id 
        AND (s.privacy_level = 'public' OR 
             s.privacy_level = 'invite_only' OR
             EXISTS(SELECT 1 FROM server_members sm WHERE sm.server_id = s.id AND sm.user_id = auth.uid()))
    )
);

CREATE POLICY "Server members can create channels" ON channels 
FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM server_members WHERE server_id = channels.server_id AND user_id = auth.uid())
);

CREATE POLICY "Server owners can update channels" ON channels 
FOR UPDATE USING (
    EXISTS(SELECT 1 FROM servers WHERE id = server_id AND owner_id = auth.uid())
);

CREATE POLICY "Server owners can delete channels" ON channels 
FOR DELETE USING (
    EXISTS(SELECT 1 FROM servers WHERE id = server_id AND owner_id = auth.uid())
);

-- Create RLS policies for server_members
CREATE POLICY "Users can view server members" ON server_members 
FOR SELECT USING (
    EXISTS(SELECT 1 FROM servers WHERE id = server_id AND privacy_level = 'public')
    OR EXISTS(SELECT 1 FROM server_members WHERE server_id = server_members.server_id AND user_id = auth.uid())
);

CREATE POLICY "Users can join servers" ON server_members 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Server owners can remove members" ON server_members 
FOR DELETE USING (
    EXISTS(SELECT 1 FROM servers WHERE id = server_id AND owner_id = auth.uid())
    OR auth.uid() = user_id
);

-- Create RLS policies for messages
CREATE POLICY "Public server messages are visible to everyone" ON messages 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM channels c
        JOIN servers s ON c.server_id = s.id
        WHERE c.id = channel_id 
        AND (s.privacy_level = 'public' OR 
             s.privacy_level = 'invite_only' OR
             EXISTS(SELECT 1 FROM server_members sm WHERE sm.server_id = s.id AND sm.user_id = auth.uid()))
    )
);

CREATE POLICY "Server members can send messages" ON messages 
FOR INSERT WITH CHECK (
    EXISTS(
        SELECT 1 FROM server_members sm
        JOIN channels c ON sm.server_id = c.server_id
        WHERE c.id = channel_id AND sm.user_id = auth.uid()
    )
);

CREATE POLICY "Users can edit own messages" ON messages 
FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own messages" ON messages 
FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);

-- Show final status
SELECT '=== DATABASE SETUP COMPLETE ===' as info;
SELECT 'All tables, functions, and policies have been created successfully!' as status;
