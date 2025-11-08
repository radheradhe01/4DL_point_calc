-- Migration script to make prize_money column optional (allow NULL)
-- Run this in your Supabase SQL Editor

-- First, drop the NOT NULL constraint and DEFAULT value
ALTER TABLE lobbies 
ALTER COLUMN prize_money DROP NOT NULL,
ALTER COLUMN prize_money DROP DEFAULT;

-- Optional: Update existing empty strings to NULL for consistency
UPDATE lobbies 
SET prize_money = NULL 
WHERE prize_money = '' OR prize_money IS NULL;

-- Verify the change
-- You can run this query to check:
-- SELECT column_name, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'lobbies' AND column_name = 'prize_money';

