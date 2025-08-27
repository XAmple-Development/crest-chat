-- Fix Auth Users System
-- This script ensures the auth system works properly with direct auth.users access

-- 1. Ensure profiles table exists and has the right structure
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

-- 2. Create profiles for existing auth users that don't have them
INSERT INTO profiles (id, username, discriminator, display_name, avatar_url, status, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'username',
    SPLIT_PART(au.email, '@', 1)
  ) as username,
  LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0') as discriminator,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'username',
    SPLIT_PART(au.email, '@', 1)
  ) as display_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  'online' as status,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL; -- Only confirmed users

-- 3. Update RLS policies to allow auth users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Show current status
SELECT '=== AUTH USERS STATUS ===' as info;
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

SELECT '=== PROFILES STATUS ===' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN status = 'online' THEN 1 END) as online_users,
  COUNT(CASE WHEN status != 'online' THEN 1 END) as offline_users
FROM profiles;

SELECT '=== USERS WITHOUT PROFILES ===' as info;
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL;
