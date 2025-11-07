export interface Team {
  id: string;
  lobbyId: string;
  name: string;
  slotNumber: number; // 1-12
}

export interface MatchResult {
  teamId: string;
  placement: number; // 1-12
  kills: number;
  points: number; // calculated: placement + kills
}

export interface Match {
  id: string;
  lobbyId: string;
  matchNumber: number; // 1-6
  results: MatchResult[];
  createdAt: string;
}

export interface Lobby {
  id: string;
  name: string;
  date: string;
  status: 'not_started' | 'in_progress' | 'completed';
  hostNotes?: string;
  tournamentName: string;
  prizeMoney: string;
  tournamentStage: string;
  backgroundTemplate?: string; // Template ID instead of image URL
  backgroundImageUrl?: string; // Keep for backward compatibility, but prefer backgroundTemplate
  teams: Team[];
  matches: Match[];
  createdAt: string;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  totalPoints: number;
  booyahs: number; // count of 1st place finishes (Wins)
  totalKills: number; // Kill points
  totalPlacementPoints: number; // Placement points
  rank: number;
  slotNumber: number;
  matchesPlayed: number; // Number of matches played
}
