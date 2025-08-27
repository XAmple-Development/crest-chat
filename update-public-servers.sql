-- Update Server System to Make Servers Public by Default
-- This script updates the server system to allow public servers with owner controls

-- 1. Update existing servers to be public by default
UPDATE servers 
SET is_public = true 
WHERE is_public IS NULL OR is_public = false;

-- 2. Add a new column for server privacy settings
ALTER TABLE servers 
ADD COLUMN IF NOT EXISTS privacy_level VARCHAR(20) DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'invite_only'));

-- 3. Update existing servers to have public privacy level
UPDATE servers 
SET privacy_level = 'public' 
WHERE privacy_level IS NULL;

-- 4. Add a column for server invite codes (for invite-only servers)
ALTER TABLE servers 
ADD COLUMN IF NOT EXISTS invite_code VARCHAR(10) UNIQUE;

-- 5. Generate invite codes for existing servers
UPDATE servers 
SET invite_code = upper(substring(md5(random()::text) from 1 for 8))
WHERE invite_code IS NULL;

-- 6. Create a function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10);
    exists BOOLEAN;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        SELECT EXISTS(
            SELECT 1 FROM servers WHERE invite_code = code
        ) INTO exists;
        
        EXIT WHEN NOT exists;
        
        attempts := attempts + 1;
        IF attempts > max_attempts THEN
            -- Fallback: use timestamp-based code
            code := upper(substring(md5(extract(epoch from now())::text) from 1 for 8));
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 7. Update RLS policies to allow public server access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Server members can view server" ON servers;
DROP POLICY IF EXISTS "Users can view public servers" ON servers;

-- Create new policies that allow public access
CREATE POLICY "Public servers are visible to everyone" ON servers 
FOR SELECT USING (
    privacy_level = 'public' OR 
    privacy_level = 'invite_only' OR
    EXISTS(SELECT 1 FROM server_members WHERE server_id = id AND user_id = auth.uid())
);

CREATE POLICY "Server owners can update server" ON servers 
FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create servers" ON servers 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. Update channel policies to allow public access
DROP POLICY IF EXISTS "Server members can view channels" ON channels;

CREATE POLICY "Public server channels are visible to everyone" ON channels 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM servers s 
        WHERE s.id = server_id 
        AND (s.privacy_level = 'public' OR 
             s.privacy_level = 'invite_only' OR
             EXISTS(SELECT 1 FROM server_members sm WHERE sm.server_id = s.id AND sm.user_id = auth.uid()))
    )
);

-- 9. Update message policies to allow public access
DROP POLICY IF EXISTS "Channel members can view messages" ON messages;

CREATE POLICY "Public server messages are visible to everyone" ON messages 
FOR SELECT USING (
    EXISTS(
        SELECT 1 FROM channels c
        JOIN servers s ON c.server_id = s.id
        WHERE c.id = channel_id 
        AND (s.privacy_level = 'public' OR 
             s.privacy_level = 'invite_only' OR
             EXISTS(SELECT 1 FROM server_members sm WHERE sm.server_id = s.id AND sm.user_id = auth.uid()))
    )
);

-- 10. Create a function to join servers via invite code
CREATE OR REPLACE FUNCTION join_server_by_invite(invite_code_param VARCHAR(10))
RETURNS BOOLEAN AS $$
DECLARE
    server_record RECORD;
BEGIN
    -- Find the server by invite code
    SELECT * INTO server_record 
    FROM servers 
    WHERE invite_code = invite_code_param;
    
    -- Check if server exists and is invite-only or public
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;
    
    IF server_record.privacy_level = 'private' THEN
        RAISE EXCEPTION 'This server is private';
    END IF;
    
    -- Check if user is already a member
    IF EXISTS(
        SELECT 1 FROM server_members 
        WHERE server_id = server_record.id AND user_id = auth.uid()
    ) THEN
        RETURN true; -- Already a member
    END IF;
    
    -- Add user to server
    INSERT INTO server_members (server_id, user_id)
    VALUES (server_record.id, auth.uid());
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to join server: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant execute permission on the join function
GRANT EXECUTE ON FUNCTION join_server_by_invite(VARCHAR(10)) TO authenticated;

-- 12. Show the updated server structure
SELECT '=== UPDATED SERVER STRUCTURE ===' as info;
SELECT 
    id,
    name,
    privacy_level,
    invite_code,
    owner_id,
    created_at
FROM servers 
ORDER BY created_at DESC;

-- 13. Show final status
SELECT '=== FINAL STATUS ===' as info;
SELECT 
    COUNT(*) as total_servers,
    COUNT(CASE WHEN privacy_level = 'public' THEN 1 END) as public_servers,
    COUNT(CASE WHEN privacy_level = 'private' THEN 1 END) as private_servers,
    COUNT(CASE WHEN privacy_level = 'invite_only' THEN 1 END) as invite_only_servers
FROM servers;
