-- Add role column to server_members table if it doesn't exist
-- This will add a role column with default value 'member'

-- First check if the column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'server_members' 
AND column_name = 'role'
AND table_schema = 'public';

-- Add the role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'server_members' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE server_members ADD COLUMN role VARCHAR(20) DEFAULT 'member';
        
        -- Update existing records to have 'owner' role for server owners
        UPDATE server_members 
        SET role = 'owner' 
        WHERE user_id IN (
            SELECT owner_id FROM servers
        );
        
        -- Update all other records to have 'member' role
        UPDATE server_members 
        SET role = 'member' 
        WHERE role IS NULL;
        
        RAISE NOTICE 'Role column added to server_members table';
    ELSE
        RAISE NOTICE 'Role column already exists in server_members table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'server_members' 
AND table_schema = 'public'
ORDER BY ordinal_position;
