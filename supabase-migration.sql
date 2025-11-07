-- Migration script to add tournament branding fields to existing lobbies table
-- Run this if you already have the database set up

-- Add new columns to lobbies table
ALTER TABLE lobbies 
ADD COLUMN IF NOT EXISTS tournament_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS prize_money TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS tournament_stage TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Note: After running this migration, you may want to update existing lobbies
-- with default values or remove the DEFAULT constraints if needed

