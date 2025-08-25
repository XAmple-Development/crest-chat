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
