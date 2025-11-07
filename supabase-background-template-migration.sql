-- Migration: Add background_template column to lobbies table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE lobbies 
ADD COLUMN IF NOT EXISTS background_template TEXT;

-- Add comment for documentation
COMMENT ON COLUMN lobbies.background_template IS 'Template ID for predefined background templates';

