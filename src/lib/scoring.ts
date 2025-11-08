import { MatchResult, LeaderboardEntry, Team, Match } from './types';

// Placement points mapping: 1st=12, 2nd=9, 3rd=8, 4th=7, 5th=6, 6th=5, 7th=4, 8th=3, 9th=2, 10th=1, 11th-12th=0
const PLACEMENT_POINTS: Record<number, number> = {
  1: 12,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
  11: 0,
  12: 0,
};

/**
 * Calculate placement points for a given placement (1-12)
 */
export function getPlacementPoints(placement: number): number {
  if (placement < 1 || placement > 12) {
    return 0;
  }
  return PLACEMENT_POINTS[placement] ?? 0;
}

/**
 * Calculate total points for a match result (placement points + kill points)
 */
export function calculateMatchPoints(placement: number, kills: number): number {
  return getPlacementPoints(placement) + kills;
}

/**
 * Calculate leaderboard entries for a lobby
 */
export function calculateLeaderboard(
  teams: Team[],
  matches: Match[]
): LeaderboardEntry[] {
  const teamStats = new Map<string, {
    teamName: string;
    slotNumber: number;
    totalPoints: number;
    booyahs: number;
    totalKills: number;
    totalPlacementPoints: number;
    matchesPlayed: number;
  }>();

  // Initialize stats for all teams
  teams.forEach(team => {
    teamStats.set(team.id, {
      teamName: team.name,
      slotNumber: team.slotNumber,
      totalPoints: 0,
      booyahs: 0,
      totalKills: 0,
      totalPlacementPoints: 0,
      matchesPlayed: 0,
    });
  });

  // Aggregate stats from all matches
  matches.forEach(match => {
    match.results.forEach(result => {
      const stats = teamStats.get(result.teamId);
      if (stats && result.placement !== null) {
        // Team played in this match - count stats
        const placementPoints = getPlacementPoints(result.placement);
        // Recalculate points to ensure accuracy (placement points + kills)
        const matchPoints = placementPoints + result.kills;
        stats.totalPoints += matchPoints;
        stats.totalKills += result.kills;
        stats.totalPlacementPoints += placementPoints;
        if (result.placement === 1) {
          stats.booyahs += 1;
        }
        // Only increment matches played if team actually played (placement is not null)
        stats.matchesPlayed += 1;
      }
      // If placement is null, team didn't play - don't count anything
    });
  });

  // Convert to array and sort
  const entries: LeaderboardEntry[] = Array.from(teamStats.entries()).map(
    ([teamId, stats]) => ({
      teamId,
      ...stats,
      rank: 0, // Will be set after sorting
    })
  );

  // Sort with tie-breaker logic: totalPoints → booyahs → totalKills → totalPlacementPoints
  entries.sort((a, b) => {
    // Primary: Total points (descending)
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    // Tie-breaker 1: Booyahs (descending)
    if (b.booyahs !== a.booyahs) {
      return b.booyahs - a.booyahs;
    }
    // Tie-breaker 2: Total kills (descending)
    if (b.totalKills !== a.totalKills) {
      return b.totalKills - a.totalKills;
    }
    // Tie-breaker 3: Total placement points (descending)
    return b.totalPlacementPoints - a.totalPlacementPoints;
  });

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

/**
 * Get the current match number (next match to be played)
 */
export function getCurrentMatchNumber(matches: Match[], maxMatches: number = 6): number {
  if (matches.length === 0) return 1;
  if (matches.length >= maxMatches) return maxMatches + 1; // All matches completed
  return matches.length + 1;
}

/**
 * Check if lobby is completed (all matches played)
 */
export function isLobbyCompleted(matches: Match[], maxMatches: number = 6): boolean {
  return matches.length >= maxMatches;
}

/**
 * Get lobby status based on matches
 */
export function getLobbyStatus(matches: Match[], maxMatches: number = 6): 'not_started' | 'in_progress' | 'completed' {
  if (matches.length === 0) {
    return 'not_started';
  }
  if (matches.length >= maxMatches) {
    return 'completed';
  }
  return 'in_progress';
}

