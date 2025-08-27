-- CrestChat Database Setup
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types (only if they don't exist)
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

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(32) NOT NULL,
  discriminator VARCHAR(4) NOT NULL,
  display_name VARCHAR(32),
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  custom_status TEXT,
  status user_status DEFAULT 'online',
  theme VARCHAR(20) DEFAULT 'dark',
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username, discriminator)
);

-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 100000,
  boost_level INTEGER DEFAULT 0,
  boost_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
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

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  type VARCHAR(50) DEFAULT 'default',
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  mentions_everyone BOOLEAN DEFAULT false,
  mention_roles TEXT[],
  mention_users TEXT[],
  embeds JSONB,
  attachments JSONB,
  reactions JSONB,
  flags INTEGER DEFAULT 0,
  webhook_id UUID,
  application_id UUID,
  message_reference JSONB,
  activity JSONB,
  application JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_members table
CREATE TABLE IF NOT EXISTS server_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname VARCHAR(32),
  avatar_url TEXT,
  premium_since TIMESTAMP WITH TIME ZONE,
  is_deafened BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_streaming BOOLEAN DEFAULT false,
  is_video BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'dark',
  locale VARCHAR(10) DEFAULT 'en-US',
  timezone VARCHAR(50) DEFAULT 'UTC',
  enable_notifications BOOLEAN DEFAULT true,
  enable_sounds BOOLEAN DEFAULT true,
  enable_animations BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes (only if they don't exist)
DO $$ BEGIN
    CREATE INDEX idx_messages_channel_id ON messages(channel_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_messages_author_id ON messages(author_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_channels_server_id ON channels(server_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_server_members_server_id ON server_members(server_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_server_members_user_id ON server_members(user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_servers_updated_at ON servers;
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_server_members_updated_at ON server_members;
CREATE TRIGGER update_server_members_updated_at BEFORE UPDATE ON server_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
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

-- Create trigger for new user registration (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view public servers" ON servers;
DROP POLICY IF EXISTS "Server members can view server" ON servers;
DROP POLICY IF EXISTS "Users can create servers" ON servers;
DROP POLICY IF EXISTS "Server owners can update server" ON servers;

DROP POLICY IF EXISTS "Server members can view channels" ON channels;
DROP POLICY IF EXISTS "Server members can create channels" ON channels;

DROP POLICY IF EXISTS "Channel members can view messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

DROP POLICY IF EXISTS "Users can view server members" ON server_members;
DROP POLICY IF EXISTS "Users can join servers" ON server_members;
DROP POLICY IF EXISTS "Users can leave servers" ON server_members;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for servers
CREATE POLICY "Users can view public servers" ON servers FOR SELECT USING (is_public = true);
CREATE POLICY "Server members can view server" ON servers FOR SELECT USING (
    EXISTS(SELECT 1 FROM server_members WHERE server_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users can create servers" ON servers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Server owners can update server" ON servers FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies for channels
CREATE POLICY "Server members can view channels" ON channels FOR SELECT USING (
    EXISTS(SELECT 1 FROM server_members WHERE server_id = server_id AND user_id = auth.uid())
);
CREATE POLICY "Server members can create channels" ON channels FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM server_members WHERE server_id = server_id AND user_id = auth.uid())
);

-- RLS Policies for messages
CREATE POLICY "Channel members can view messages" ON messages FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM server_members sm
        JOIN channels c ON c.server_id = sm.server_id
        WHERE c.id = channel_id AND sm.user_id = auth.uid()
    )
);
CREATE POLICY "Users can create messages" ON messages FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for server_members (FIXED: No circular dependencies)
CREATE POLICY "Users can view server members" ON server_members FOR SELECT USING (
    EXISTS(SELECT 1 FROM server_members WHERE server_id = server_id AND user_id = auth.uid())
);
-- Allow users to join servers (no membership check to avoid recursion)
CREATE POLICY "Users can join servers" ON server_members FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Allow users to leave servers they're members of
CREATE POLICY "Users can leave servers" ON server_members FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for all tables (ignore errors if already enabled)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE servers;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE channels;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE server_members;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Success message
SELECT 'Database setup completed successfully! All tables, functions, triggers, and policies have been created.' as status;
