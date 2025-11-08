import { Lobby, Team, Match, MatchResult } from './types';
import { supabaseBrowser } from './supabaseBrowser';
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
    backgroundImageUrl: row.background_image_url || undefined,
    matchesCount: row.matches_count || 6,
    registeredTeams: row.registered_teams || 12,
    playingTeams: row.playing_teams || row.registered_teams || 12,
    teams,
    matches,
    createdAt: row.created_at,
  };
}

/**
 * Convert RPC bundle response to Lobby object
 */
function bundleToLobby(bundle: any): Lobby | null {
  if (!bundle || !bundle.lobby) return null;

  const lobbyRow = bundle.lobby;
  const teams: Team[] = (bundle.teams || []).map((row: any) => ({
    id: row.id,
    lobbyId: row.lobby_id,
    name: row.name,
    slotNumber: row.slot_number,
  }));

  const matches: Match[] = (bundle.matches || []).map((matchRow: any) => ({
    id: matchRow.id,
    lobbyId: matchRow.lobby_id,
    matchNumber: matchRow.match_number,
    results: (matchRow.results || []).map((resultRow: any) => ({
      teamId: resultRow.team_id,
      placement: resultRow.placement,
      kills: resultRow.kills,
      points: resultRow.points,
    })),
    createdAt: matchRow.created_at,
  }));

  return dbRowToLobby(lobbyRow, teams, matches);
}

/**
 * Get a single lobby by ID using optimized RPC function
 * ONE HTTP request instead of 4+
 */
export async function getLobby(id: string): Promise<Lobby | null> {
  try {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .rpc('get_lobby_bundle' as any, { l_id: id } as any)
      .single();

    if (error) throw error;
    if (!data) return null;

    return bundleToLobby(data);
  } catch (error) {
    console.error('Error fetching lobby from Supabase:', error);
    return null;
  }
}

/**
 * Get all lobbies - optimized with lightweight summary
 * Uses RPC for better performance
 */
export async function getAllLobbies(): Promise<Lobby[]> {
  try {
    const supabase = supabaseBrowser();
    
    // First get lightweight summaries
    const { data: summaries, error: summaryError } = await supabase
      .rpc('get_lobbies_summary' as any);

    if (summaryError) throw summaryError;
    if (!summaries || !Array.isArray(summaries) || (summaries as any[]).length === 0) return [];

    // For dashboard, we can return lightweight versions
    // Full details loaded on-demand when viewing a lobby
    return (summaries as any[]).map((summary: any) => ({
      id: summary.id,
      name: summary.name,
      date: summary.date,
      status: summary.status,
      hostNotes: undefined,
      tournamentName: '',
      prizeMoney: '',
      tournamentStage: '',
      backgroundTemplate: undefined,
      backgroundImageUrl: undefined,
      matchesCount: summary.matches_count || 6,
      registeredTeams: summary.registered_teams || 12,
      playingTeams: summary.playing_teams || summary.registered_teams || 12,
      teams: [],
      matches: [],
      createdAt: summary.created_at,
    }));
  } catch (error) {
    console.error('Error fetching lobbies from Supabase:', error);
    return [];
  }
}

/**
 * Save a lobby using optimized RPC transaction
 * ONE HTTP request instead of 10+
 */
export async function saveLobby(lobby: Lobby): Promise<void> {
  try {
    const supabase = supabaseBrowser();

    // Prepare lobby data
    const lobbyData = {
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
    };

    // Prepare teams data
    const teamsData = lobby.teams.map(team => ({
      id: team.id,
      name: team.name,
      slotNumber: team.slotNumber,
    }));

    // Prepare matches data (only up to matchesCount)
    const matchesData = lobby.matches
      .filter(match => match.matchNumber <= (lobby.matchesCount || 6))
      .map(match => ({
        id: match.id,
        matchNumber: match.matchNumber,
        results: match.results.map(result => ({
          teamId: result.teamId,
          placement: result.placement,
          kills: result.kills,
          points: result.points,
        })),
      }));

    // Single RPC call handles everything in one transaction
    const { error } = await supabase.rpc('save_lobby_tx' as any, {
      p_lobby: lobbyData,
      p_teams: teamsData,
      p_matches: matchesData,
    } as any);

    if (error) throw error;
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
    const supabase = supabaseBrowser();

    // Delete existing match results
    const { error: deleteError } = await supabase
      .from('match_results' as any)
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
        .from('match_results' as any)
        .insert(resultRows as any);

      if (insertError) throw insertError;
    }

    // Update lobby's updated_at timestamp
    const { error: updateError } = await (supabase
      .from('lobbies' as any) as any)
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
    const supabase = supabaseBrowser();
    const { error } = await (supabase
      .from('lobbies' as any) as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting lobby from Supabase:', error);
    throw error;
  }
}

/**
 * Get lobbies filtered by date - optimized with selective columns
 */
export async function getLobbiesByDate(date: string): Promise<Lobby[]> {
  try {
    const supabase = supabaseBrowser();
    
    // Only fetch essential columns for list view
    const { data: lobbyRows, error: lobbyError } = await (supabase
      .from('lobbies' as any) as any)
      .select('id,name,date,status,matches_count,registered_teams,playing_teams,created_at')
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (lobbyError) throw lobbyError;
    if (!lobbyRows || !Array.isArray(lobbyRows) || (lobbyRows as any[]).length === 0) return [];

    // Return lightweight versions (full details loaded on-demand)
    return (lobbyRows as any[]).map((row: any) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      status: row.status,
      hostNotes: undefined,
      tournamentName: '',
      prizeMoney: '',
      tournamentStage: '',
      backgroundTemplate: undefined,
      backgroundImageUrl: undefined,
      matchesCount: row.matches_count || 6,
      registeredTeams: row.registered_teams || 12,
      playingTeams: row.playing_teams || row.registered_teams || 12,
      teams: [],
      matches: [],
      createdAt: row.created_at,
    }));
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
