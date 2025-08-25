-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_status AS ENUM ('online', 'idle', 'dnd', 'offline');
CREATE TYPE channel_type AS ENUM ('text', 'voice', 'announcement', 'stage', 'forum');
CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'file', 'embed', 'system');
CREATE TYPE role_permission AS ENUM (
  'manage_channels', 'manage_roles', 'manage_messages', 'manage_server',
  'kick_members', 'ban_members', 'administrator', 'mention_everyone',
  'use_external_emojis', 'use_external_stickers', 'add_reactions',
  'priority_speaker', 'stream', 'view_channel', 'send_messages',
  'send_tts_messages', 'manage_messages', 'embed_links', 'attach_files',
  'read_message_history', 'use_slash_commands', 'connect', 'speak',
  'use_vad', 'change_nickname', 'manage_nicknames', 'view_audit_log'
);

-- Profiles table (enhanced Discord-like profile)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  display_name VARCHAR(32),
  discriminator VARCHAR(4) NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  status user_status DEFAULT 'online',
  custom_status TEXT,
  theme VARCHAR(20) DEFAULT 'dark',
  locale VARCHAR(10) DEFAULT 'en-US',
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_verified BOOLEAN DEFAULT false,
  is_bot BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  flags INTEGER DEFAULT 0,
  premium_type INTEGER DEFAULT 0,
  premium_since TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servers table (enhanced Discord-like server)
CREATE TABLE servers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  max_members INTEGER DEFAULT 500000,
  boost_level INTEGER DEFAULT 0,
  boost_count INTEGER DEFAULT 0,
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

-- Server roles table (Discord-like roles)
CREATE TABLE server_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color INTEGER DEFAULT 0,
  hoist BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  permissions BIGINT DEFAULT 0,
  mentionable BOOLEAN DEFAULT false,
  managed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels table (enhanced Discord-like channels)
CREATE TABLE channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type channel_type DEFAULT 'text',
  position INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  is_nsfw BOOLEAN DEFAULT false,
  is_announcement BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  topic TEXT,
  rate_limit_per_user INTEGER DEFAULT 0,
  bitrate INTEGER DEFAULT 64000,
  user_limit INTEGER DEFAULT 0,
  rtc_region VARCHAR(50),
  video_quality_mode INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Server members table (enhanced Discord-like member)
CREATE TABLE server_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nickname VARCHAR(32),
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  premium_since TIMESTAMP WITH TIME ZONE,
  is_deafened BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_streaming BOOLEAN DEFAULT false,
  is_video BOOLEAN DEFAULT false,
  UNIQUE(server_id, user_id)
);

-- Member roles junction table
CREATE TABLE member_roles (
  member_id UUID REFERENCES server_members(id) ON DELETE CASCADE,
  role_id UUID REFERENCES server_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, role_id)
);

-- Messages table (enhanced Discord-like messages)
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  type message_type DEFAULT 'text',
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  mentions_everyone BOOLEAN DEFAULT false,
  mention_roles UUID[],
  mention_users UUID[],
  embeds JSONB[],
  attachments JSONB[],
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

-- Direct messages table
CREATE TABLE direct_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_message_id UUID REFERENCES messages(id),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- DM channels table
CREATE TABLE dm_channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dm_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100),
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friendships table (enhanced Discord-like friends)
CREATE TABLE friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Voice states table (Discord-like voice)
CREATE TABLE voice_states (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  is_deafened BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_self_deafened BOOLEAN DEFAULT false,
  is_self_muted BOOLEAN DEFAULT false,
  is_streaming BOOLEAN DEFAULT false,
  is_video BOOLEAN DEFAULT false,
  is_speaking BOOLEAN DEFAULT false,
  request_to_speak_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invites table (enhanced Discord-like invites)
CREATE TABLE invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  max_uses INTEGER DEFAULT 0,
  uses INTEGER DEFAULT 0,
  max_age INTEGER DEFAULT 0, -- 0 = never expires
  is_temporary BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table (Discord-like audit log)
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_id UUID,
  target_type VARCHAR(50),
  action_type VARCHAR(50) NOT NULL,
  changes JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emojis table (Discord-like emojis)
CREATE TABLE emojis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(32) NOT NULL,
  image_url TEXT NOT NULL,
  is_animated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stickers table (Discord-like stickers)
CREATE TABLE stickers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(32) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  format_type INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhooks table (Discord-like webhooks)
CREATE TABLE webhooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(80) NOT NULL,
  avatar_url TEXT,
  token TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table (Discord-like user settings)
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme VARCHAR(20) DEFAULT 'dark',
  locale VARCHAR(10) DEFAULT 'en-US',
  timezone VARCHAR(50) DEFAULT 'UTC',
  status user_status DEFAULT 'online',
  custom_status TEXT,
  message_notifications INTEGER DEFAULT 1,
  mention_notifications BOOLEAN DEFAULT true,
  sound_notifications BOOLEAN DEFAULT true,
  show_current_game BOOLEAN DEFAULT true,
  show_activity_status BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  allow_direct_messages BOOLEAN DEFAULT true,
  show_online_status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_discriminator ON profiles(discriminator);
CREATE INDEX idx_servers_owner_id ON servers(owner_id);
CREATE INDEX idx_servers_invite_code ON servers(invite_code);
CREATE INDEX idx_channels_server_id ON channels(server_id);
CREATE INDEX idx_channels_type ON channels(type);
CREATE INDEX idx_server_members_server_id ON server_members(server_id);
CREATE INDEX idx_server_members_user_id ON server_members(user_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_author_id ON messages(author_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_voice_states_user_id ON voice_states(user_id);
CREATE INDEX idx_voice_states_channel_id ON voice_states(channel_id);
CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_server_id ON invites(server_id);

-- Create functions for automatic updates
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
CREATE TRIGGER update_server_roles_updated_at BEFORE UPDATE ON server_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voice_states_updated_at BEFORE UPDATE ON voice_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_discriminator VARCHAR(4);
  username_exists BOOLEAN;
BEGIN
  -- Generate a unique discriminator
  LOOP
    new_discriminator := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM profiles WHERE discriminator = new_discriminator) INTO username_exists;
    IF NOT username_exists THEN
      EXIT;
    END IF;
  END LOOP;

  -- Create profile
  INSERT INTO profiles (id, username, discriminator, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    new_discriminator,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Create user settings
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update server member count
CREATE OR REPLACE FUNCTION update_server_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE servers 
    SET member_count = member_count + 1 
    WHERE id = NEW.server_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE servers 
    SET member_count = member_count - 1 
    WHERE id = OLD.server_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for server member count
CREATE TRIGGER update_server_member_count_trigger
  AFTER INSERT OR DELETE ON server_members
  FOR EACH ROW EXECUTE FUNCTION update_server_member_count();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Servers policies
CREATE POLICY "Users can view servers they're members of" ON servers FOR SELECT USING (
  EXISTS(SELECT 1 FROM server_members WHERE server_id = servers.id AND user_id = auth.uid())
);
CREATE POLICY "Server owners can update servers" ON servers FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can create servers" ON servers FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Server roles policies
CREATE POLICY "Users can view roles in their servers" ON server_roles FOR SELECT USING (
  EXISTS(SELECT 1 FROM server_members WHERE server_id = server_roles.server_id AND user_id = auth.uid())
);
CREATE POLICY "Server owners can manage roles" ON server_roles FOR ALL USING (
  EXISTS(SELECT 1 FROM servers WHERE id = server_roles.server_id AND owner_id = auth.uid())
);

-- Channels policies
CREATE POLICY "Users can view channels in their servers" ON channels FOR SELECT USING (
  server_id IS NULL OR EXISTS(SELECT 1 FROM server_members WHERE server_id = channels.server_id AND user_id = auth.uid())
);
CREATE POLICY "Server owners can manage channels" ON channels FOR ALL USING (
  EXISTS(SELECT 1 FROM servers WHERE id = channels.server_id AND owner_id = auth.uid())
);

-- Server members policies
CREATE POLICY "Users can view members in their servers" ON server_members FOR SELECT USING (
  EXISTS(SELECT 1 FROM server_members sm WHERE sm.server_id = server_members.server_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Users can join public servers" ON server_members FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM servers WHERE id = server_id AND is_public = true)
);
CREATE POLICY "Server owners can manage members" ON server_members FOR ALL USING (
  EXISTS(SELECT 1 FROM servers WHERE id = server_members.server_id AND owner_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view messages in their channels" ON messages FOR SELECT USING (
  EXISTS(SELECT 1 FROM server_members sm 
         JOIN channels c ON c.server_id = sm.server_id 
         WHERE c.id = messages.channel_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Users can send messages in their channels" ON messages FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM server_members sm 
         JOIN channels c ON c.server_id = sm.server_id 
         WHERE c.id = messages.channel_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (author_id = auth.uid());

-- Direct messages policies
CREATE POLICY "Users can view their DMs" ON direct_messages FOR SELECT USING (
  user1_id = auth.uid() OR user2_id = auth.uid()
);
CREATE POLICY "Users can create DMs" ON direct_messages FOR INSERT WITH CHECK (
  user1_id = auth.uid() OR user2_id = auth.uid()
);

-- Voice states policies
CREATE POLICY "Users can view voice states in their servers" ON voice_states FOR SELECT USING (
  server_id IS NULL OR EXISTS(SELECT 1 FROM server_members WHERE server_id = voice_states.server_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own voice state" ON voice_states FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own voice state" ON voice_states FOR INSERT WITH CHECK (user_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());

-- Insert default roles for new servers
CREATE OR REPLACE FUNCTION create_default_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Create @everyone role
  INSERT INTO server_roles (server_id, name, color, position, permissions)
  VALUES (NEW.id, '@everyone', 0, 0, 0);
  
  -- Create @owner role
  INSERT INTO server_roles (server_id, name, color, position, permissions, hoist)
  VALUES (NEW.id, '@owner', 16776960, 1, 2147483647, true);
  
  -- Add owner to server members
  INSERT INTO server_members (server_id, user_id)
  VALUES (NEW.id, NEW.owner_id);
  
  -- Add owner to owner role
  INSERT INTO member_roles (member_id, role_id)
  SELECT sm.id, sr.id
  FROM server_members sm
  JOIN server_roles sr ON sr.server_id = sm.server_id
  WHERE sm.server_id = NEW.id AND sm.user_id = NEW.owner_id AND sr.name = '@owner';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for creating default roles
CREATE TRIGGER create_default_roles_trigger
  AFTER INSERT ON servers
  FOR EACH ROW EXECUTE FUNCTION create_default_roles();