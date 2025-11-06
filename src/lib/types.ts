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
  teams: Team[];
  matches: Match[];
  createdAt: string;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  totalPoints: number;
  booyahs: number; // count of 1st place finishes
  totalKills: number;
  totalPlacementPoints: number;
  rank: number;
  slotNumber: number;
}

