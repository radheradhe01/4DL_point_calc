export interface Team {
  id: string;
  lobbyId: string;
  name: string;
  slotNumber: number; // 1-N (dynamic based on registeredTeams)
}

export interface MatchResult {
  teamId: string;
  placement: number | null; // 1-N (dynamic based on playingTeams)
  kills: number;
  points: number; // calculated: placement + kills
}

export interface Match {
  id: string;
  lobbyId: string;
  matchNumber: number; // 1-N (dynamic based on matchesCount)
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
  prizeMoney?: string;
  tournamentStage: string;
  backgroundTemplate?: string; // Template ID instead of image URL
  backgroundImageUrl?: string; // Keep for backward compatibility, but prefer backgroundTemplate
  pointsTemplate?: string; // Points sheet template ID (e.g., 'wildwest_v1')
  matchesCount: number; // Configurable number of matches (default: 6)
  registeredTeams: number; // Total teams registered (default: 12)
  playingTeams: number; // Teams actually playing (default: 12, <= registeredTeams)
  teams: Team[];
  matches: Match[];
  createdAt: string;
  matchesPlayed?: number; // Optional: for lightweight summaries from RPC
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
