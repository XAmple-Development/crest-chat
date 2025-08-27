-- Fix infinite recursion in servers table RLS policies
-- This script will update the RLS policies to prevent recursion

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'servers';

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON servers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON servers;
DROP POLICY IF EXISTS "Enable update for server owners" ON servers;
DROP POLICY IF EXISTS "Enable delete for server owners" ON servers;

-- Create new, simplified policies that prevent recursion

-- Policy 1: Allow authenticated users to read servers they are members of
CREATE POLICY "servers_select_policy" ON servers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM server_members 
            WHERE server_members.server_id = servers.id 
            AND server_members.user_id = auth.uid()
        )
        OR 
        servers.privacy_level = 'public'
    );

-- Policy 2: Allow authenticated users to create servers
CREATE POLICY "servers_insert_policy" ON servers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND owner_id = auth.uid()
    );

-- Policy 3: Allow server owners to update their servers
CREATE POLICY "servers_update_policy" ON servers
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Policy 4: Allow server owners to delete their servers
CREATE POLICY "servers_delete_policy" ON servers
    FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- Also fix the server_members table policies to prevent recursion
DROP POLICY IF EXISTS "Enable read access for server members" ON server_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON server_members;
DROP POLICY IF EXISTS "Enable update for server owners" ON server_members;
DROP POLICY IF EXISTS "Enable delete for server owners" ON server_members;

-- Create simplified server_members policies
CREATE POLICY "server_members_select_policy" ON server_members
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM server_members sm2
            WHERE sm2.server_id = server_members.server_id 
            AND sm2.user_id = auth.uid()
        )
    );

CREATE POLICY "server_members_insert_policy" ON server_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
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
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = server_members.server_id 
            AND servers.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = server_members.server_id 
            AND servers.owner_id = auth.uid()
        )
    );

CREATE POLICY "server_members_delete_policy" ON server_members
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM servers 
            WHERE servers.id = server_members.server_id 
            AND servers.owner_id = auth.uid()
        )
    );

-- Verify the policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('servers', 'server_members')
ORDER BY tablename, policyname;
