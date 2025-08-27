-- Reset Database Script
-- WARNING: This will delete ALL data and recreate the database structure
-- Only run this if you want to start completely fresh

-- Drop all tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS server_members CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS servers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all triggers (they should be dropped with tables, but just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_servers_updated_at ON servers;
DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS update_server_members_updated_at ON server_members;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

-- Drop enum types
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS channel_type CASCADE;

-- Success message
SELECT 'Database reset completed. All tables, functions, triggers, and types have been removed.' as status;
