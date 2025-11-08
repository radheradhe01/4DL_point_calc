-- Performance Optimization SQL Script
-- Run this in your Supabase SQL Editor to add indexes and RPC functions

-- ============================================
-- 1. ADD DATABASE INDEXES
-- ============================================
-- These indexes dramatically speed up queries

CREATE INDEX IF NOT EXISTS idx_matches_lobby 
  ON matches (lobby_id);

CREATE INDEX IF NOT EXISTS idx_results_match 
  ON match_results (match_id);

CREATE INDEX IF NOT EXISTS idx_results_team 
  ON match_results (team_id);

CREATE INDEX IF NOT EXISTS idx_teams_lobby_slot 
  ON teams (lobby_id, slot_number);

CREATE INDEX IF NOT EXISTS idx_lobbies_date 
  ON lobbies (date);

CREATE INDEX IF NOT EXISTS idx_lobbies_created_at 
  ON lobbies (created_at DESC);

-- ============================================
-- 2. RPC FUNCTION: Get Lobby Bundle
-- ============================================
-- Fetches lobby + teams + matches + results in ONE call
-- Reduces 4+ HTTP requests to 1

CREATE OR REPLACE FUNCTION public.get_lobby_bundle(l_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'lobby', (
      SELECT row_to_json(l)
      FROM lobbies l
      WHERE l.id = l_id
    ),
    'teams', (
      SELECT COALESCE(jsonb_agg(t ORDER BY t.slot_number), '[]'::jsonb)
      FROM teams t
      WHERE t.lobby_id = l_id
    ),
    'matches', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'lobby_id', m.lobby_id,
          'match_number', m.match_number,
          'created_at', m.created_at,
          'results', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                'team_id', r.team_id,
                'placement', r.placement,
                'kills', r.kills,
                'points', r.points
              )
            ), '[]'::jsonb)
            FROM match_results r
            WHERE r.match_id = m.id
          )
        )
        ORDER BY m.match_number
      ), '[]'::jsonb)
      FROM matches m
      WHERE m.lobby_id = l_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_lobby_bundle(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_lobby_bundle(TEXT) TO authenticated;

-- ============================================
-- 3. RPC FUNCTION: Save Lobby Transaction
-- ============================================
-- Saves lobby + teams + matches + results in ONE transaction
-- Reduces 10+ HTTP requests to 1

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

        -- Insert match results
        IF v_match->'results' IS NOT NULL AND jsonb_array_length(v_match->'results') > 0 THEN
          INSERT INTO match_results (match_id, team_id, placement, kills, points)
          SELECT
            v_match_id,
            result->>'teamId',
            (result->>'placement')::INTEGER,
            (result->>'kills')::INTEGER,
            (result->>'points')::INTEGER
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
-- 4. RPC FUNCTION: Get All Lobbies Summary
-- ============================================
-- Returns lightweight lobby summaries for dashboard
-- Only fetches essential fields

CREATE OR REPLACE FUNCTION public.get_lobbies_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'date', l.date,
        'status', l.status,
        'matches_count', l.matches_count,
        'registered_teams', l.registered_teams,
        'playing_teams', l.playing_teams,
        'created_at', l.created_at,
        'matches_played', (
          SELECT COUNT(*)
          FROM matches m
          WHERE m.lobby_id = l.id
        )
      )
      ORDER BY l.created_at DESC
    ), '[]'::jsonb)
    FROM lobbies l
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lobbies_summary() TO anon;
GRANT EXECUTE ON FUNCTION public.get_lobbies_summary() TO authenticated;

