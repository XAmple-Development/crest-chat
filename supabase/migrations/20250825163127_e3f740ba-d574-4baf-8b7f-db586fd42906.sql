-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.channel_type AS ENUM ('text', 'voice');
CREATE TYPE public.server_role AS ENUM ('owner', 'admin', 'moderator', 'member');
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'blocked');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  status TEXT DEFAULT 'offline',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create servers table
CREATE TABLE public.servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'base64'),
  is_public BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channels table
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type channel_type NOT NULL DEFAULT 'text',
  position INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create server_members table
CREATE TABLE public.server_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role server_role NOT NULL DEFAULT 'member',
  nickname TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(server_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Create direct_messages table for private conversations
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (sender_id != recipient_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.get_user_server_role(user_uuid UUID, server_uuid UUID)
RETURNS server_role AS $$
  SELECT role FROM public.server_members 
  WHERE user_id = user_uuid AND server_id = server_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_server_member(user_uuid UUID, server_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.server_members 
    WHERE user_id = user_uuid AND server_id = server_uuid
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.are_friends(user1_uuid UUID, user2_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND ((requester_id = user1_uuid AND addressee_id = user2_uuid) 
         OR (requester_id = user2_uuid AND addressee_id = user1_uuid))
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for servers
CREATE POLICY "Anyone can view public servers" ON public.servers
  FOR SELECT USING (is_public = true OR public.is_server_member(auth.uid(), id));

CREATE POLICY "Server owners can update their servers" ON public.servers
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can create servers" ON public.servers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Server owners can delete their servers" ON public.servers
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for channels
CREATE POLICY "Server members can view channels" ON public.channels
  FOR SELECT USING (public.is_server_member(auth.uid(), server_id));

CREATE POLICY "Server admins can manage channels" ON public.channels
  FOR ALL USING (
    public.get_user_server_role(auth.uid(), server_id) IN ('owner', 'admin')
  );

-- RLS Policies for server_members
CREATE POLICY "Server members can view other members" ON public.server_members
  FOR SELECT USING (public.is_server_member(auth.uid(), server_id));

CREATE POLICY "Users can join servers" ON public.server_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave servers or admins can remove members" ON public.server_members
  FOR DELETE USING (
    auth.uid() = user_id OR 
    public.get_user_server_role(auth.uid(), server_id) IN ('owner', 'admin')
  );

-- RLS Policies for messages
CREATE POLICY "Server members can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.channels c 
      WHERE c.id = channel_id AND public.is_server_member(auth.uid(), c.server_id)
    )
  );

CREATE POLICY "Users can send messages to channels they have access to" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.channels c 
      WHERE c.id = channel_id AND public.is_server_member(auth.uid(), c.server_id)
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages or admins can delete any" ON public.messages
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.channels c 
      WHERE c.id = channel_id 
      AND public.get_user_server_role(auth.uid(), c.server_id) IN ('owner', 'admin', 'moderator')
    )
  );

-- RLS Policies for friendships
CREATE POLICY "Users can view their own friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendship status" ON public.friendships
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- RLS Policies for direct_messages
CREATE POLICY "Users can view their own DMs" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send DMs to friends" ON public.direct_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    public.are_friends(sender_id, recipient_id)
  );

CREATE POLICY "Users can update their own DMs" ON public.direct_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own DMs" ON public.direct_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_servers_owner_id ON public.servers(owner_id);
CREATE INDEX idx_channels_server_id ON public.channels(server_id);
CREATE INDEX idx_server_members_server_id ON public.server_members(server_id);
CREATE INDEX idx_server_members_user_id ON public.server_members(user_id);
CREATE INDEX idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_friendships_requester_id ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee_id ON public.friendships(addressee_id);
CREATE INDEX idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient_id ON public.direct_messages(recipient_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servers_updated_at
  BEFORE UPDATE ON public.servers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fix profile creation trigger
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_discriminator VARCHAR(4);
  username_exists BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  -- Generate a unique discriminator with retry logic
  LOOP
    attempt_count := attempt_count + 1;
    new_discriminator := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if discriminator already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE discriminator = new_discriminator) INTO username_exists;
    
    IF NOT username_exists THEN
      EXIT;
    END IF;
    
    -- Prevent infinite loop
    IF attempt_count >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique discriminator after % attempts', max_attempts;
    END IF;
  END LOOP;

  -- Create profile with proper error handling
  BEGIN
    INSERT INTO profiles (id, username, discriminator, display_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      new_discriminator,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;

  -- Create user settings with proper error handling
  BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create user settings for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a function to manually create profiles for existing users
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
  new_discriminator VARCHAR(4);
  username_exists BOOLEAN;
BEGIN
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM profiles)
  LOOP
    -- Generate unique discriminator
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
      auth_user.id,
      COALESCE(auth_user.raw_user_meta_data->>'username', split_part(auth_user.email, '@', 1)),
      new_discriminator,
      COALESCE(auth_user.raw_user_meta_data->>'display_name', split_part(auth_user.email, '@', 1))
    );

    -- Create user settings
    INSERT INTO user_settings (user_id)
    VALUES (auth_user.id);

    RAISE NOTICE 'Created profile for user %', auth_user.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to create missing profiles
SELECT create_missing_profiles();

-- Clean up the temporary function
DROP FUNCTION create_missing_profiles();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update server member count
CREATE OR REPLACE FUNCTION public.update_server_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.servers 
    SET member_count = member_count + 1 
    WHERE id = NEW.server_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.servers 
    SET member_count = member_count - 1 
    WHERE id = OLD.server_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update member count
CREATE TRIGGER update_member_count
  AFTER INSERT OR DELETE ON public.server_members
  FOR EACH ROW EXECUTE FUNCTION public.update_server_member_count();

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.servers REPLICA IDENTITY FULL;
ALTER TABLE public.channels REPLICA IDENTITY FULL;
ALTER TABLE public.server_members REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.friendships REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.servers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.server_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE servers;
ALTER PUBLICATION supabase_realtime ADD TABLE server_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE server_members;
ALTER PUBLICATION supabase_realtime ADD TABLE member_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_states;
ALTER PUBLICATION supabase_realtime ADD TABLE invites;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE emojis;
ALTER PUBLICATION supabase_realtime ADD TABLE stickers;
ALTER PUBLICATION supabase_realtime ADD TABLE webhooks;
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;