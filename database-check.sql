-- Database Check Script for LovableChat
-- Run this in your Supabase SQL Editor to verify the setup

-- Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'servers', 'channels', 'server_members', 'messages', 'friendships', 'direct_messages') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'servers', 'channels', 'server_members', 'messages', 'friendships', 'direct_messages');

-- Check RLS policies
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
  AND tablename IN ('profiles', 'servers', 'channels', 'server_members', 'messages', 'friendships', 'direct_messages')
ORDER BY tablename, policyname;

-- Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table IN ('profiles', 'servers', 'channels', 'server_members', 'messages', 'friendships', 'direct_messages')
ORDER BY event_object_table, trigger_name;

-- Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('handle_new_user', 'update_updated_at_column', 'update_server_member_count', 'get_user_server_role', 'is_server_member', 'are_friends')
ORDER BY routine_name;

-- Test user creation (this will create a test user)
-- Uncomment the lines below to test user creation
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"testuser","display_name":"Test User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);
*/

-- Check current user count
SELECT COUNT(*) as total_users FROM auth.users;

-- Check current profiles count
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check current servers count
SELECT COUNT(*) as total_servers FROM public.servers;

-- Check if realtime is enabled
SELECT 
  schemaname,
  tablename,
  attname,
  atttypid::regtype as data_type
FROM pg_attribute 
WHERE attrelid = 'public.profiles'::regclass 
  AND attname = 'xmin';

-- Show recent activity (last 10 records from each table)
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 'servers' as table_name, COUNT(*) as record_count FROM public.servers
UNION ALL
SELECT 'channels' as table_name, COUNT(*) as record_count FROM public.channels
UNION ALL
SELECT 'server_members' as table_name, COUNT(*) as record_count FROM public.server_members
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as record_count FROM public.messages
UNION ALL
SELECT 'friendships' as table_name, COUNT(*) as record_count FROM public.friendships
UNION ALL
SELECT 'direct_messages' as table_name, COUNT(*) as record_count FROM public.direct_messages;
