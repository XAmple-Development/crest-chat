-- Fix Server Visibility Issues
-- Run this if servers exist but aren't visible to users

-- 1. First, let's check what we have
SELECT 'Current state:' as info;
SELECT COUNT(*) as server_count FROM servers;
SELECT COUNT(*) as member_count FROM server_members;
SELECT COUNT(*) as profile_count FROM profiles;

-- 2. Fix any servers without owners by setting them to the first user
UPDATE servers 
SET owner_id = (SELECT id FROM profiles LIMIT 1)
WHERE owner_id IS NULL;

-- 3. Ensure all servers have at least one member (the owner)
INSERT INTO server_members (server_id, user_id)
SELECT s.id, s.owner_id
FROM servers s
WHERE NOT EXISTS (
    SELECT 1 FROM server_members sm 
    WHERE sm.server_id = s.id AND sm.user_id = s.owner_id
)
AND s.owner_id IS NOT NULL;

-- 4. Fix RLS policies to be more permissive for debugging
-- Drop existing policies
DROP POLICY IF EXISTS "Server members can view server" ON servers;
DROP POLICY IF EXISTS "Users can view public servers" ON servers;

-- Create more permissive policies for debugging
CREATE POLICY "Debug: Users can view all servers" ON servers FOR SELECT USING (true);
CREATE POLICY "Debug: Users can create servers" ON servers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Fix server_members policies
DROP POLICY IF EXISTS "Users can view server members" ON server_members;
DROP POLICY IF EXISTS "Users can join servers" ON server_members;

CREATE POLICY "Debug: Users can view all server members" ON server_members FOR SELECT USING (true);
CREATE POLICY "Debug: Users can join servers" ON server_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Check the result
SELECT 'After fixes:' as info;
SELECT COUNT(*) as server_count FROM servers;
SELECT COUNT(*) as member_count FROM server_members;

-- 7. Show all servers and their members
SELECT 
    s.id as server_id,
    s.name as server_name,
    s.owner_id,
    COUNT(sm.user_id) as member_count
FROM servers s
LEFT JOIN server_members sm ON s.id = sm.server_id
GROUP BY s.id, s.name, s.owner_id
ORDER BY s.created_at DESC;
