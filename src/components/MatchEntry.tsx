'use client';

import { useState, useEffect } from 'react';
import { Team, Match, MatchResult } from '@/lib/types';
import { calculateMatchPoints } from '@/lib/scoring';

interface MatchEntryProps {
  teams: Team[];
  currentMatchNumber: number;
  previousMatches?: Match[]; // Previous matches to calculate cumulative points
  onSave: (results: MatchResult[]) => void;
  isLoading?: boolean;
  maxMatches?: number; // Maximum number of matches
  playingTeams?: number; // Number of teams actually playing
}

export default function MatchEntry({ teams, currentMatchNumber, previousMatches = [], onSave, isLoading, maxMatches = 6, playingTeams }: MatchEntryProps) {
  const actualPlayingTeams = playingTeams || teams.length;
  
  const [results, setResults] = useState<Record<string, { placement: number | null; kills: number }>>(() => {
    const initial: Record<string, { placement: number | null; kills: number }> = {};
    // Initialize with no placements selected - only for playing teams
    teams.slice(0, actualPlayingTeams).forEach((team) => {
      initial[team.id] = { placement: null, kills: 0 };
    });
    return initial;
  });

  // Reset form state when match number changes
  useEffect(() => {
    const initial: Record<string, { placement: number | null; kills: number }> = {};
    // Only initialize for playing teams
    teams.slice(0, actualPlayingTeams).forEach((team) => {
      initial[team.id] = { placement: null, kills: 0 };
    });
    setResults(initial);
  }, [currentMatchNumber, teams, actualPlayingTeams]);

  // Get currently assigned placements (excluding the current team being edited)
  const getAssignedPlacements = (excludeTeamId?: string): Set<number> => {
    const assigned = new Set<number>();
    Object.entries(results).forEach(([teamId, result]) => {
      if (teamId !== excludeTeamId && result.placement !== null) {
        assigned.add(result.placement);
      }
    });
    return assigned;
  };

  const handlePlacementChange = (teamId: string, newPlacement: string) => {
    // Handle "NOT_PLAYED" option
    if (newPlacement === 'NOT_PLAYED') {
      setResults(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], placement: null, kills: 0 }, // Reset kills to 0 when not played
      }));
      return;
    }
    
    const placementValue = newPlacement === '' ? null : parseInt(newPlacement);
    const assignedPlacements = getAssignedPlacements(teamId);
    
    if (placementValue === null) {
      // Clear placement
      setResults(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], placement: null },
      }));
      return;
    }
    
    // Check if the new placement is already taken
    if (assignedPlacements.has(placementValue)) {
      // Find which team has this placement
      const conflictingTeam = teams.find(t => {
        const result = results[t.id];
        return t.id !== teamId && result?.placement === placementValue;
      });
      
      if (conflictingTeam) {
        // Swap placements: give the conflicting team the current team's placement
        const currentPlacement = results[teamId].placement;
        setResults(prev => ({
          ...prev,
          [teamId]: { ...prev[teamId], placement: placementValue },
          [conflictingTeam.id]: { ...prev[conflictingTeam.id], placement: currentPlacement },
        }));
      }
    } else {
      // Placement is available, assign it
      setResults(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], placement: placementValue },
      }));
    }
  };

  const handleKillsChange = (teamId: string, kills: number) => {
    setResults(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], kills: Math.max(0, kills) },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate playing teams
    const playingTeamsList = teams.slice(0, actualPlayingTeams);
    
    // Get teams that actually played (have a placement)
    const teamsPlayed = playingTeamsList.filter(team => results[team.id]?.placement !== null);
    
    // Validate that at least one team played
    if (teamsPlayed.length === 0) {
      alert('Error: At least one team must have a placement assigned. Teams can choose "NOT Played" if they did not participate.');
      return;
    }
    
    // Validate that all placements are unique (among teams that played)
    const placements = teamsPlayed
      .map(team => results[team.id]?.placement)
      .filter((p): p is number => p !== null);
    
    const uniquePlacements = new Set(placements);
    if (uniquePlacements.size !== placements.length) {
      alert(`Error: Each team must have a unique placement. Please ensure all placements are different.`);
      return;
    }

    // Validate that placements are sequential starting from 1 (no gaps allowed)
    // For example, if 3 teams played, they should have placements 1, 2, 3
    const sortedPlacements = [...placements].sort((a, b) => a - b);
    const expectedPlacements = Array.from({ length: teamsPlayed.length }, (_, i) => i + 1);
    const hasSequentialPlacements = sortedPlacements.length === expectedPlacements.length &&
      sortedPlacements.every((val, idx) => val === expectedPlacements[idx]);
    
    if (!hasSequentialPlacements) {
      alert(`Error: Placements must be sequential starting from 1. If ${teamsPlayed.length} teams played, they should have placements 1-${teamsPlayed.length}.`);
      return;
    }

    // Include all teams (both played and not played)
    const matchResults: MatchResult[] = playingTeamsList.map(team => {
      const result = results[team.id];
      if (result.placement === null) {
        // Team did not play - return with null placement, 0 kills, 0 points
        return {
          teamId: team.id,
          placement: null,
          kills: 0,
          points: 0,
        };
      }
      // Team played - calculate points
      return {
        teamId: team.id,
        placement: result.placement,
        kills: result.kills,
        points: calculateMatchPoints(result.placement, result.kills),
      };
    });

    onSave(matchResults);
  };

  // Get placement status for visual feedback
  const getPlacementStatus = (placement: number, currentTeamId: string): 'available' | 'taken' | 'current' => {
    const assignedPlacements = getAssignedPlacements(currentTeamId);
    if (results[currentTeamId]?.placement === placement) {
      return 'current';
    }
    return assignedPlacements.has(placement) ? 'taken' : 'available';
  };

  // Check if all placements are assigned
  const allPlacementsAssigned = Object.values(results).every(r => r.placement !== null);

  // Sort teams by slot number for display
  const sortedTeams = [...teams].sort((a, b) => a.slotNumber - b.slotNumber);
  
  // Generate placement options dynamically based on playing teams
  const placementOptions = Array.from({ length: actualPlayingTeams }, (_, i) => i + 1);
  
  // Get all assigned placements for summary (only teams that played)
  const allPlacements = Object.values(results)
    .map(r => r.placement)
    .filter((p): p is number => p !== null);
  const teamsPlayed = allPlacements.length;
  const isAllPlacementsUnique = teamsPlayed > 0 && new Set(allPlacements).size === teamsPlayed;
  const sortedPlacements = [...allPlacements].sort((a, b) => a - b);
  const hasSequentialPlacements = teamsPlayed > 0 && 
    sortedPlacements.every((val, idx) => val === idx + 1);

  // Calculate cumulative points for each team (previous matches + current match)
  const getCumulativePoints = (teamId: string): number => {
    // Sum points from previous matches
    let previousPoints = 0;
    previousMatches.forEach(match => {
      const matchResult = match.results.find(r => r.teamId === teamId);
      if (matchResult) {
        previousPoints += matchResult.points;
      }
    });
    
    // Add current match points (if placement is set)
    const currentResult = results[teamId];
    if (currentResult && currentResult.placement !== null) {
      const currentMatchPoints = calculateMatchPoints(currentResult.placement, currentResult.kills);
      return previousPoints + currentMatchPoints;
    }
    
    return previousPoints;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Match {currentMatchNumber} Entry
        </h2>
        <div className="text-xs sm:text-sm">
          {hasSequentialPlacements && isAllPlacementsUnique ? (
            <span className="inline-block px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
              ✓ Ready to save ({teamsPlayed} team{teamsPlayed !== 1 ? 's' : ''} played)
            </span>
          ) : teamsPlayed === 0 ? (
            <span className="inline-block px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
              ⚠ At least one team must play
            </span>
          ) : (
            <span className="inline-block px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
              ⚠ Placements must be sequential (1-{teamsPlayed})
            </span>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3">
          {sortedTeams.slice(0, actualPlayingTeams).map((team) => {
            const result = results[team.id];
            const currentMatchPoints = result.placement !== null 
              ? calculateMatchPoints(result.placement, result.kills) 
              : 0;
            const cumulativePoints = getCumulativePoints(team.id);
            const assignedPlacements = getAssignedPlacements(team.id);
            
            return (
              <div
                key={team.id}
                className="border border-gray-200 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">Slot #{team.slotNumber}</span>
                    <h3 className="text-sm font-semibold text-gray-900">{team.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Current: {currentMatchPoints}</div>
                    <div className="text-lg font-bold text-blue-600">Total: {cumulativePoints}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Placement</label>
                    <select
                      value={result.placement === null ? 'NOT_PLAYED' : result.placement.toString()}
                      onChange={(e) => handlePlacementChange(team.id, e.target.value)}
                      className={`w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 ${
                        result.placement === null
                          ? 'border-gray-300 bg-gray-50'
                          : hasSequentialPlacements && isAllPlacementsUnique
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <option value="NOT_PLAYED">NOT Played</option>
                      {placementOptions.map((place) => {
                        const isTaken = assignedPlacements.has(place);
                        const teamWithPlacement = isTaken 
                          ? teams.find(t => t.id !== team.id && results[t.id]?.placement === place)
                          : null;
                        
                        return (
                          <option 
                            key={place} 
                            value={place}
                          >
                            {place}
                            {isTaken && teamWithPlacement ? ` (${teamWithPlacement.name})` : ''}
                          </option>
                        );
                      })}
                    </select>
                    {result.placement === null && (
                      <p className="text-xs text-gray-600 mt-1">Team did not play</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Kills</label>
                    <input
                      type="number"
                      min="0"
                      value={result.kills}
                      onChange={(e) => handleKillsChange(team.id, parseInt(e.target.value) || 0)}
                      disabled={result.placement === null}
                      className={`w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white ${
                        result.placement === null ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block space-y-3">
          <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-700 pb-2 border-b border-gray-300">
            <div className="col-span-2">Slot</div>
            <div className="col-span-3">Team Name</div>
            <div className="col-span-2">Placement</div>
            <div className="col-span-2">Kills</div>
            <div className="col-span-3">Points</div>
          </div>

          {sortedTeams.slice(0, actualPlayingTeams).map((team) => {
            const result = results[team.id];
            const currentMatchPoints = result.placement !== null 
              ? calculateMatchPoints(result.placement, result.kills) 
              : 0;
            const cumulativePoints = getCumulativePoints(team.id);
            const assignedPlacements = getAssignedPlacements(team.id);
            
            return (
              <div
                key={team.id}
                className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-2 text-sm font-medium text-gray-600">
                  #{team.slotNumber}
                </div>
                <div className="col-span-3 text-sm font-medium text-gray-900">
                  {team.name}
                </div>
                <div className="col-span-2">
                  <select
                    value={result.placement === null ? 'NOT_PLAYED' : result.placement.toString()}
                    onChange={(e) => handlePlacementChange(team.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 ${
                      result.placement === null
                        ? 'border-gray-300 bg-gray-50'
                        : hasSequentialPlacements && isAllPlacementsUnique
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <option value="NOT_PLAYED">NOT Played</option>
                    {placementOptions.map((place) => {
                      const isTaken = assignedPlacements.has(place);
                      const teamWithPlacement = isTaken 
                        ? teams.find(t => t.id !== team.id && results[t.id]?.placement === place)
                        : null;
                      
                      return (
                        <option 
                          key={place} 
                          value={place}
                        >
                          {place}
                          {isTaken && teamWithPlacement ? ` (${teamWithPlacement.name})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {result.placement === null && (
                    <p className="text-xs text-gray-600 mt-1">
                      Team did not play
                    </p>
                  )}
                  {result.placement !== null && !isAllPlacementsUnique && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Selecting a taken placement will swap with that team
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    value={result.kills}
                    onChange={(e) => handleKillsChange(team.id, parseInt(e.target.value) || 0)}
                    disabled={result.placement === null}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white ${
                      result.placement === null ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500">Current: {currentMatchPoints}</div>
                  <div className="text-sm font-bold text-blue-600">Total: {cumulativePoints}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 sm:mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isLoading ? 'Saving...' : `Save Match ${currentMatchNumber}`}
          </button>
        </div>
      </form>
    </div>
  );
}

