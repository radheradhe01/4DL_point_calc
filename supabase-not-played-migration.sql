-- Migration script to allow "NOT Played" option for teams in matches
-- This allows placement to be NULL, meaning the team didn't play in that match
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. ALTER TABLE: Allow NULL placement
-- ============================================
-- Drop the NOT NULL constraint and modify CHECK constraint to allow NULL

ALTER TABLE match_results 
ALTER COLUMN placement DROP NOT NULL;

-- Drop the existing CHECK constraint (if it exists)
ALTER TABLE match_results 
DROP CONSTRAINT IF EXISTS match_results_placement_check;

-- Add new CHECK constraint that allows NULL or values 1-12
ALTER TABLE match_results 
ADD CONSTRAINT match_results_placement_check 
CHECK (placement IS NULL OR (placement >= 1 AND placement <= 12));

-- Note: The UNIQUE constraint on (match_id, placement) will still work
-- PostgreSQL allows multiple NULL values in UNIQUE constraints, so multiple
-- teams can have NULL placement (didn't play) in the same match

-- ============================================
-- 2. UPDATE RPC FUNCTION: Handle NULL placement
-- ============================================
-- Update save_lobby_tx to handle NULL placement values

CREATE OR REPLACE FUNCTION public.save_lobby_tx(
  p_lobby JSONB,
  p_teams JSONB,
  p_matches JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match JSONB;
  v_result JSONB;
  v_match_id TEXT;
BEGIN
  -- Upsert lobby
  INSERT INTO lobbies (
    id, name, date, status, host_notes,
    tournament_name, prize_money, tournament_stage,
    background_image_url, background_template,
    matches_count, registered_teams, playing_teams,
    updated_at
  ) VALUES (
    p_lobby->>'id',
    p_lobby->>'name',
    (p_lobby->>'date')::DATE,
    p_lobby->>'status',
    NULLIF(p_lobby->>'host_notes', ''),
    p_lobby->>'tournament_name',
    p_lobby->>'prize_money',
    p_lobby->>'tournament_stage',
    NULLIF(p_lobby->>'background_image_url', ''),
    NULLIF(p_lobby->>'background_template', ''),
    COALESCE((p_lobby->>'matches_count')::INTEGER, 6),
    COALESCE((p_lobby->>'registered_teams')::INTEGER, 12),
    COALESCE((p_lobby->>'playing_teams')::INTEGER, 12),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    date = EXCLUDED.date,
    status = EXCLUDED.status,
    host_notes = EXCLUDED.host_notes,
    tournament_name = EXCLUDED.tournament_name,
    prize_money = EXCLUDED.prize_money,
    tournament_stage = EXCLUDED.tournament_stage,
    background_image_url = EXCLUDED.background_image_url,
    background_template = EXCLUDED.background_template,
    matches_count = EXCLUDED.matches_count,
    registered_teams = EXCLUDED.registered_teams,
    playing_teams = EXCLUDED.playing_teams,
    updated_at = NOW();

  -- Delete existing teams, matches, and results (cascade handles results)
  DELETE FROM matches WHERE lobby_id = p_lobby->>'id';
  DELETE FROM teams WHERE lobby_id = p_lobby->>'id';

  -- Insert teams
  IF p_teams IS NOT NULL AND jsonb_array_length(p_teams) > 0 THEN
    INSERT INTO teams (id, lobby_id, name, slot_number)
    SELECT
      team->>'id',
      p_lobby->>'id',
      team->>'name',
      (team->>'slotNumber')::INTEGER
    FROM jsonb_array_elements(p_teams) AS team;
  END IF;

  -- Insert matches and results
  IF p_matches IS NOT NULL AND jsonb_array_length(p_matches) > 0 THEN
    FOR v_match IN SELECT * FROM jsonb_array_elements(p_matches)
    LOOP
      -- Only insert matches up to matches_count
      IF (v_match->>'matchNumber')::INTEGER <= COALESCE((p_lobby->>'matches_count')::INTEGER, 6) THEN
        -- Insert match
        INSERT INTO matches (id, lobby_id, match_number)
        VALUES (
          v_match->>'id',
          p_lobby->>'id',
          (v_match->>'matchNumber')::INTEGER
        )
        ON CONFLICT (id) DO NOTHING;

        v_match_id := v_match->>'id';

        -- Insert match results (handle NULL placement for "NOT Played")
        IF v_match->'results' IS NOT NULL AND jsonb_array_length(v_match->'results') > 0 THEN
          INSERT INTO match_results (match_id, team_id, placement, kills, points)
          SELECT
            v_match_id,
            result->>'teamId',
            -- Handle NULL placement: if placement is null/empty string, insert NULL
            CASE 
              WHEN result->>'placement' IS NULL OR result->>'placement' = '' THEN NULL
              ELSE (result->>'placement')::INTEGER
            END,
            COALESCE((result->>'kills')::INTEGER, 0),
            COALESCE((result->>'points')::INTEGER, 0)
          FROM jsonb_array_elements(v_match->'results') AS result;
        END IF;
      END IF;
    END LOOP;

    -- Delete excess matches
    DELETE FROM matches
    WHERE lobby_id = p_lobby->>'id'
      AND match_number > COALESCE((p_lobby->>'matches_count')::INTEGER, 6);
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.save_lobby_tx(JSONB, JSONB, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.save_lobby_tx(JSONB, JSONB, JSONB) TO authenticated;

-- ============================================
-- 3. VERIFY CHANGES
-- ============================================
-- You can run this query to verify the column allows NULL:
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'match_results' AND column_name = 'placement';
-- 
-- Should show: is_nullable = 'YES'

