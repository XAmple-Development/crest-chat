-- Complete New Database Setup for CrestChat
-- This script creates a fresh database with all proper relationships

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('online', 'idle', 'dnd', 'invisible', 'offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('text', 'voice', 'announcement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('default', 'system', 'user_join', 'user_leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Role permission enum removed - using VARCHAR instead

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    status user_status DEFAULT 'online',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code VARCHAR(10) UNIQUE,
    privacy_level VARCHAR(20) DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    type channel_type DEFAULT 'text',
    description TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_members table
CREATE TABLE IF NOT EXISTS server_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(server_id, user_id)
);

-- Create messages table with proper foreign key relationships
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type message_type DEFAULT 'default',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    mentions_everyone BOOLEAN DEFAULT FALSE,
    mention_roles TEXT[],
    mention_users UUID[],
    embeds JSONB,
    attachments JSONB,
    reactions JSONB,
    flags INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status user_status DEFAULT 'online',
    display_name VARCHAR(255),
    bio TEXT,
    theme VARCHAR(20) DEFAULT 'dark',
    notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_servers_owner_id ON servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_servers_invite_code ON servers(invite_code);
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

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
BEGIN
    RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Create function to join server by invite
CREATE OR REPLACE FUNCTION join_server_by_invite(invite_code_param VARCHAR(10))
RETURNS BOOLEAN AS $$
DECLARE
    server_record RECORD;
BEGIN
    -- Find server by invite code
    SELECT * INTO server_record FROM servers WHERE invite_code = invite_code_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (SELECT 1 FROM server_members WHERE server_id = server_record.id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Already a member of this server';
    END IF;
    
    -- Add user as member
    INSERT INTO server_members (server_id, user_id, role) VALUES (server_record.id, auth.uid(), 'member');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION join_server_by_invite(VARCHAR) TO authenticated;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create RLS policies for servers
CREATE POLICY "servers_select_policy" ON servers
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM server_members 
            WHERE server_members.server_id = servers.id 
            AND server_members.user_id = auth.uid()
        )
        OR 
        servers.privacy_level = 'public'
    );

CREATE POLICY "servers_insert_policy" ON servers
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "servers_update_policy" ON servers
    FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "servers_delete_policy" ON servers
    FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Create RLS policies for channels
CREATE POLICY "channels_select_policy" ON channels
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM server_members 
            WHERE server_members.server_id = channels.server_id 
            AND server_members.user_id = auth.uid()
        )
    );

CREATE POLICY "channels_insert_policy" ON channels
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = channels.server_id 
            AND servers.owner_id = auth.uid()
        )
    );

CREATE POLICY "channels_update_policy" ON channels
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = channels.server_id 
            AND servers.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = channels.server_id 
            AND servers.owner_id = auth.uid()
        )
    );

CREATE POLICY "channels_delete_policy" ON channels
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = channels.server_id 
            AND servers.owner_id = auth.uid()
        )
    );

-- Create RLS policies for server_members
CREATE POLICY "server_members_select_policy" ON server_members
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM server_members sm2
            WHERE sm2.server_id = server_members.server_id 
            AND sm2.user_id = auth.uid()
        )
    );

CREATE POLICY "server_members_insert_policy" ON server_members
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            user_id = auth.uid()
            OR 
            EXISTS (
                SELECT 1 FROM servers 
                WHERE servers.id = server_members.server_id 
                AND servers.owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "server_members_update_policy" ON server_members
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = server_members.server_id 
            AND servers.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = server_members.server_id 
            AND servers.owner_id = auth.uid()
        )
    );

CREATE POLICY "server_members_delete_policy" ON server_members
    FOR DELETE TO authenticated USING (
        user_id = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = server_members.server_id 
            AND servers.owner_id = auth.uid()
        )
    );

-- Create RLS policies for messages
CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM server_members 
            JOIN channels ON channels.server_id = server_members.server_id
            WHERE channels.id = messages.channel_id 
            AND server_members.user_id = auth.uid()
        )
    );

CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT TO authenticated WITH CHECK (
        author_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM server_members 
            JOIN channels ON channels.server_id = server_members.server_id
            WHERE channels.id = messages.channel_id 
            AND server_members.user_id = auth.uid()
        )
    );

CREATE POLICY "messages_update_policy" ON messages
    FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "messages_delete_policy" ON messages
    FOR DELETE TO authenticated USING (
        author_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM servers 
            JOIN channels ON channels.server_id = servers.id
            WHERE channels.id = messages.channel_id 
            AND servers.owner_id = auth.uid()
        )
    );

-- Create RLS policies for user_settings
CREATE POLICY "user_settings_select_policy" ON user_settings
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_policy" ON user_settings
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_policy" ON user_settings
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_delete_policy" ON user_settings
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Insert some sample data (optional)
INSERT INTO profiles (id, username, display_name, email, status) VALUES 
    (uuid_generate_v4(), 'admin', 'Admin User', 'admin@example.com', 'online')
ON CONFLICT (username) DO NOTHING;

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
