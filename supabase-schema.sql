-- Free Fire Tournament Manager Database Schema
-- Run this SQL in your Supabase SQL Editor to create the tables

-- IMPORTANT: Before running this schema, create a Supabase Storage bucket:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a new bucket named "tournament-backgrounds"
-- 3. Set it to Public (for public read access)
-- 4. Enable CORS if needed for image exports

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  host_notes TEXT,
  tournament_name TEXT NOT NULL DEFAULT '',
  prize_money TEXT NOT NULL DEFAULT '',
  tournament_stage TEXT NOT NULL DEFAULT '',
  background_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  lobby_id TEXT NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slot_number INTEGER NOT NULL CHECK (slot_number >= 1 AND slot_number <= 12),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lobby_id, slot_number)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  lobby_id TEXT NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  match_number INTEGER NOT NULL CHECK (match_number >= 1 AND match_number <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lobby_id, match_number)
);

-- Match results table
CREATE TABLE IF NOT EXISTS match_results (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  placement INTEGER NOT NULL CHECK (placement >= 1 AND placement <= 12),
  kills INTEGER NOT NULL CHECK (kills >= 0),
  points INTEGER NOT NULL CHECK (points >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, team_id),
  UNIQUE(match_id, placement)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teams_lobby_id ON teams(lobby_id);
CREATE INDEX IF NOT EXISTS idx_matches_lobby_id ON matches(lobby_id);
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_team_id ON match_results(team_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_date ON lobbies(date);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);

-- Enable Row Level Security (RLS) - Allow public read/write for now
-- You can restrict this later based on your authentication needs
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (for now)
-- In production, you should add proper authentication and restrict access
CREATE POLICY "Allow public read access" ON lobbies FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON lobbies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON lobbies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON lobbies FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON teams FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON teams FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON matches FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON matches FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON match_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON match_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON match_results FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON match_results FOR DELETE USING (true);

