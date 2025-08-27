-- Simple fix for server creation infinite recursion
-- This removes all RLS policies and creates minimal ones

-- Disable RLS temporarily
ALTER TABLE servers DISABLE ROW LEVEL SECURITY;
ALTER TABLE server_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON servers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON servers;
DROP POLICY IF EXISTS "Enable update for server owners" ON servers;
DROP POLICY IF EXISTS "Enable delete for server owners" ON servers;
DROP POLICY IF EXISTS "servers_select_policy" ON servers;
DROP POLICY IF EXISTS "servers_insert_policy" ON servers;
DROP POLICY IF EXISTS "servers_update_policy" ON servers;
DROP POLICY IF EXISTS "servers_delete_policy" ON servers;

DROP POLICY IF EXISTS "Enable read access for server members" ON server_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON server_members;
DROP POLICY IF EXISTS "Enable update for server owners" ON server_members;
DROP POLICY IF EXISTS "Enable delete for server owners" ON server_members;
DROP POLICY IF EXISTS "server_members_select_policy" ON server_members;
DROP POLICY IF EXISTS "server_members_insert_policy" ON server_members;
DROP POLICY IF EXISTS "server_members_update_policy" ON server_members;
DROP POLICY IF EXISTS "server_members_delete_policy" ON server_members;

-- Re-enable RLS
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;

-- Create minimal policies that won't cause recursion

-- Servers table - very simple policies
CREATE POLICY "servers_all_policy" ON servers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Server members table - very simple policies  
CREATE POLICY "server_members_all_policy" ON server_members
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('servers', 'server_members')
ORDER BY tablename, policyname;
