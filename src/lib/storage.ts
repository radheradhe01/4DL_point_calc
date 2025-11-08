import { Lobby, Team, Match, MatchResult } from './types';
import { supabase } from './supabase';
import { calculateMatchPoints } from './scoring';

/**
 * Convert database lobby row to Lobby object
 */
function dbRowToLobby(row: any, teams: Team[], matches: Match[]): Lobby {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    status: row.status,
    hostNotes: row.host_notes || undefined,
    tournamentName: row.tournament_name || '',
    prizeMoney: row.prize_money || '',
    tournamentStage: row.tournament_stage || '',
    backgroundTemplate: row.background_template || undefined,
    backgroundImageUrl: row.background_image_url || undefined, // Keep for backward compatibility
    matchesCount: row.matches_count || 6, // Default to 6 for backward compatibility
    registeredTeams: row.registered_teams || 12, // Default to 12 for backward compatibility
    playingTeams: row.playing_teams || row.registered_teams || 12, // Default to registeredTeams or 12
    teams,
    matches,
    createdAt: row.created_at,
  };
}

/**
 * Get all lobbies from Supabase
 */
export async function getAllLobbies(): Promise<Lobby[]> {
  try {
    // Fetch all lobbies
    const { data: lobbyRows, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .order('created_at', { ascending: false });

    if (lobbyError) throw lobbyError;
    if (!lobbyRows) return [];

    // Fetch all teams and matches for each lobby
    const lobbies: Lobby[] = [];
    
    for (const lobbyRow of lobbyRows) {
      // Fetch teams for this lobby
      const { data: teamRows, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('lobby_id', lobbyRow.id)
        .order('slot_number', { ascending: true });

      if (teamError) throw teamError;

      const teams: Team[] = (teamRows || []).map(row => ({
        id: row.id,
        lobbyId: row.lobby_id,
        name: row.name,
        slotNumber: row.slot_number,
      }));

      // Fetch matches for this lobby
      const { data: matchRows, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('lobby_id', lobbyRow.id)
        .order('match_number', { ascending: true });

      if (matchError) throw matchError;

      const matches: Match[] = [];
      
      for (const matchRow of matchRows || []) {
        // Fetch match results for this match
        const { data: resultRows, error: resultError } = await supabase
          .from('match_results')
          .select('*')
          .eq('match_id', matchRow.id);

        if (resultError) throw resultError;

        const results: MatchResult[] = (resultRows || []).map(resultRow => ({
          teamId: resultRow.team_id,
          placement: resultRow.placement,
          kills: resultRow.kills,
          points: resultRow.points,
        }));

        matches.push({
          id: matchRow.id,
          lobbyId: matchRow.lobby_id,
          matchNumber: matchRow.match_number,
          results,
          createdAt: matchRow.created_at,
        });
      }

      lobbies.push(dbRowToLobby(lobbyRow, teams, matches));
    }

    return lobbies;
  } catch (error) {
    console.error('Error fetching lobbies from Supabase:', error);
    return [];
  }
}

/**
 * Get a single lobby by ID
 */
export async function getLobby(id: string): Promise<Lobby | null> {
  try {
    // Fetch lobby
    const { data: lobbyRow, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', id)
      .single();

    if (lobbyError) throw lobbyError;
    if (!lobbyRow) return null;

    // Fetch teams
    const { data: teamRows, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('lobby_id', id)
      .order('slot_number', { ascending: true });

    if (teamError) throw teamError;

    const teams: Team[] = (teamRows || []).map(row => ({
      id: row.id,
      lobbyId: row.lobby_id,
      name: row.name,
      slotNumber: row.slot_number,
    }));

    // Fetch matches
    const { data: matchRows, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('lobby_id', id)
      .order('match_number', { ascending: true });

    if (matchError) throw matchError;

    const matches: Match[] = [];
    
    for (const matchRow of matchRows || []) {
      // Fetch match results
      const { data: resultRows, error: resultError } = await supabase
        .from('match_results')
        .select('*')
        .eq('match_id', matchRow.id);

      if (resultError) throw resultError;

      const results: MatchResult[] = (resultRows || []).map(resultRow => ({
        teamId: resultRow.team_id,
        placement: resultRow.placement,
        kills: resultRow.kills,
        points: resultRow.points,
      }));

      matches.push({
        id: matchRow.id,
        lobbyId: matchRow.lobby_id,
        matchNumber: matchRow.match_number,
        results,
        createdAt: matchRow.created_at,
      });
    }

    return dbRowToLobby(lobbyRow, teams, matches);
  } catch (error) {
    console.error('Error fetching lobby from Supabase:', error);
    return null;
  }
}

/**
 * Save a lobby (create or update)
 */
export async function saveLobby(lobby: Lobby): Promise<void> {
  try {
    // Upsert lobby
    const { error: lobbyError } = await supabase
      .from('lobbies')
      .upsert({
        id: lobby.id,
        name: lobby.name,
        date: lobby.date,
        status: lobby.status,
        host_notes: lobby.hostNotes || null,
        tournament_name: lobby.tournamentName,
        prize_money: lobby.prizeMoney,
        tournament_stage: lobby.tournamentStage,
        background_image_url: lobby.backgroundImageUrl || null,
        background_template: lobby.backgroundTemplate || null,
        matches_count: lobby.matchesCount || 6,
        registered_teams: lobby.registeredTeams || 12,
        playing_teams: lobby.playingTeams || lobby.registeredTeams || 12,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (lobbyError) throw lobbyError;

    // Get existing teams to preserve IDs
    const { data: existingTeams, error: existingTeamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('lobby_id', lobby.id);

    if (existingTeamsError) throw existingTeamsError;

    // Delete existing match results and matches first (to avoid foreign key issues)
    const { data: existingMatches, error: matchFetchError } = await supabase
      .from('matches')
      .select('id')
      .eq('lobby_id', lobby.id);

    if (matchFetchError) throw matchFetchError;

    // Delete match results for existing matches
    if (existingMatches && existingMatches.length > 0) {
      const matchIds = existingMatches.map(m => m.id);
      const { error: resultDeleteError } = await supabase
        .from('match_results')
        .delete()
        .in('match_id', matchIds);

      if (resultDeleteError) throw resultDeleteError;
    }

    // Delete matches
    const { error: matchDeleteError } = await supabase
      .from('matches')
      .delete()
      .eq('lobby_id', lobby.id);

    if (matchDeleteError) throw matchDeleteError;

    // Update or insert teams (preserve IDs when possible)
    if (lobby.teams.length > 0) {
      const existingTeamsMap = new Map((existingTeams || []).map(t => [t.slot_number, t]));
      
      const teamsToUpdate: any[] = [];
      const teamsToInsert: any[] = [];
      
      lobby.teams.forEach((team, index) => {
        const existingTeam = existingTeamsMap.get(team.slotNumber);
        if (existingTeam) {
          // Update existing team (preserve ID)
          teamsToUpdate.push({
            id: existingTeam.id,
            name: team.name,
            slot_number: team.slotNumber,
          });
        } else {
          // Insert new team
          teamsToInsert.push({
            id: team.id,
            lobby_id: team.lobbyId,
            name: team.name,
            slot_number: team.slotNumber,
          });
        }
      });

      // Update existing teams
      if (teamsToUpdate.length > 0) {
        for (const team of teamsToUpdate) {
          const { error: updateError } = await supabase
            .from('teams')
            .update({ name: team.name })
            .eq('id', team.id);
          
          if (updateError) throw updateError;
        }
      }

      // Insert new teams
      if (teamsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('teams')
          .insert(teamsToInsert);
        
        if (insertError) throw insertError;
      }

      // Delete teams that are no longer in the lobby
      const currentSlotNumbers = new Set(lobby.teams.map(t => t.slotNumber));
      const teamsToDelete = (existingTeams || []).filter(t => !currentSlotNumbers.has(t.slot_number));
      
      if (teamsToDelete.length > 0) {
        const teamIdsToDelete = teamsToDelete.map(t => t.id);
        const { error: deleteError } = await supabase
          .from('teams')
          .delete()
          .in('id', teamIdsToDelete);
        
        if (deleteError) throw deleteError;
      }
    }

    // Insert matches and their results (only up to matchesCount)
    const matchesToInsert = lobby.matches
      .filter(match => match.matchNumber <= (lobby.matchesCount || 6))
      .sort((a, b) => a.matchNumber - b.matchNumber);
    
    for (const match of matchesToInsert) {
      // Insert match (use upsert to handle existing matches)
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .upsert({
          id: match.id,
          lobby_id: match.lobbyId,
          match_number: match.matchNumber,
        }, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Delete existing match results for this match (to avoid duplicates)
      const { error: deleteResultsError } = await supabase
        .from('match_results')
        .delete()
        .eq('match_id', match.id);

      if (deleteResultsError) throw deleteResultsError;

      // Insert match results
      if (match.results.length > 0) {
        const resultRows = match.results.map(result => ({
          match_id: match.id,
          team_id: result.teamId,
          placement: result.placement,
          kills: result.kills,
          points: result.points,
        }));

        const { error: resultError } = await supabase
          .from('match_results')
          .insert(resultRows);

        if (resultError) throw resultError;
      }
    }
    
    // Delete any matches that exceed matchesCount
    const maxMatchNumber = lobby.matchesCount || 6;
    const { error: deleteExcessMatchesError } = await supabase
      .from('matches')
      .delete()
      .eq('lobby_id', lobby.id)
      .gt('match_number', maxMatchNumber);

    if (deleteExcessMatchesError) throw deleteExcessMatchesError;
  } catch (error) {
    console.error('Error saving lobby to Supabase:', error);
    throw error;
  }
}

/**
 * Update a single match's results
 */
export async function updateMatch(lobbyId: string, matchId: string, results: MatchResult[]): Promise<void> {
  try {
    // Delete existing match results
    const { error: deleteError } = await supabase
      .from('match_results')
      .delete()
      .eq('match_id', matchId);

    if (deleteError) throw deleteError;

    // Insert updated match results
    if (results.length > 0) {
      const resultRows = results.map(result => ({
        match_id: matchId,
        team_id: result.teamId,
        placement: result.placement,
        kills: result.kills,
        points: result.points,
      }));

      const { error: insertError } = await supabase
        .from('match_results')
        .insert(resultRows);

      if (insertError) throw insertError;
    }

    // Update lobby's updated_at timestamp
    const { error: updateError } = await supabase
      .from('lobbies')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', lobbyId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating match in Supabase:', error);
    throw error;
  }
}

/**
 * Delete a lobby by ID (cascade deletes teams, matches, and results)
 */
export async function deleteLobby(id: string): Promise<void> {
  try {
    // Delete lobby (cascade will handle teams, matches, and results)
    const { error } = await supabase
      .from('lobbies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting lobby from Supabase:', error);
    throw error;
  }
}

/**
 * Get lobbies filtered by date
 */
export async function getLobbiesByDate(date: string): Promise<Lobby[]> {
  try {
    const { data: lobbyRows, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (lobbyError) throw lobbyError;
    if (!lobbyRows) return [];

    // Fetch teams and matches for each lobby (same as getAllLobbies)
    const lobbies: Lobby[] = [];
    
    for (const lobbyRow of lobbyRows) {
      const { data: teamRows, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('lobby_id', lobbyRow.id)
        .order('slot_number', { ascending: true });

      if (teamError) throw teamError;

      const teams: Team[] = (teamRows || []).map(row => ({
        id: row.id,
        lobbyId: row.lobby_id,
        name: row.name,
        slotNumber: row.slot_number,
      }));

      const { data: matchRows, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('lobby_id', lobbyRow.id)
        .order('match_number', { ascending: true });

      if (matchError) throw matchError;

      const matches: Match[] = [];
      
      for (const matchRow of matchRows || []) {
        const { data: resultRows, error: resultError } = await supabase
          .from('match_results')
          .select('*')
          .eq('match_id', matchRow.id);

        if (resultError) throw resultError;

        const results: MatchResult[] = (resultRows || []).map(resultRow => ({
          teamId: resultRow.team_id,
          placement: resultRow.placement,
          kills: resultRow.kills,
          points: resultRow.points,
        }));

        matches.push({
          id: matchRow.id,
          lobbyId: matchRow.lobby_id,
          matchNumber: matchRow.match_number,
          results,
          createdAt: matchRow.created_at,
        });
      }

      lobbies.push(dbRowToLobby(lobbyRow, teams, matches));
    }

    return lobbies;
  } catch (error) {
    console.error('Error fetching lobbies by date from Supabase:', error);
    return [];
  }
}

/**
 * Generate a unique ID for new lobbies
 */
export function generateLobbyId(): string {
  return `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
