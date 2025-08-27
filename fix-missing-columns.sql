-- Fix Missing Columns in Servers Table
-- This script adds the missing columns that are causing the error

-- 1. Add owner_id column if it doesn't exist
ALTER TABLE servers 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- 2. Add privacy_level column if it doesn't exist
ALTER TABLE servers 
ADD COLUMN IF NOT EXISTS privacy_level VARCHAR(20) DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'invite_only'));

-- 3. Add invite_code column if it doesn't exist
ALTER TABLE servers 
ADD COLUMN IF NOT EXISTS invite_code VARCHAR(10) UNIQUE;

-- 4. Update existing servers to have proper values
UPDATE servers 
SET 
    privacy_level = COALESCE(privacy_level, 'public'),
    invite_code = COALESCE(invite_code, upper(substring(md5(random()::text) from 1 for 8)))
WHERE privacy_level IS NULL OR invite_code IS NULL;

-- 5. Create the generate_invite_code function
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

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;

-- 7. Show current server structure
SELECT '=== CURRENT SERVER STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'servers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Show sample server data
SELECT '=== SAMPLE SERVER DATA ===' as info;
SELECT 
    id,
    name,
    privacy_level,
    invite_code,
    owner_id,
    created_at
FROM servers 
LIMIT 5;
