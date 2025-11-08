'use client';

import { useState, useEffect } from 'react';
import { Match, Team, MatchResult } from '@/lib/types';
import { calculateMatchPoints } from '@/lib/scoring';

interface EditMatchModalProps {
  match: Match;
  teams: Team[];
  playingTeams: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (matchId: string, results: MatchResult[]) => void;
}

export default function EditMatchModal({ match, teams, playingTeams, isOpen, onClose, onSave }: EditMatchModalProps) {
  const [results, setResults] = useState<Record<string, { placement: number | null; kills: number }>>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize results from match data
  useEffect(() => {
    if (match && isOpen) {
      const initial: Record<string, { placement: number | null; kills: number }> = {};
      const playingTeamsList = teams.slice(0, playingTeams);
      
      playingTeamsList.forEach((team) => {
        const existingResult = match.results.find(r => r.teamId === team.id);
        if (existingResult) {
          initial[team.id] = {
            placement: existingResult.placement,
            kills: existingResult.kills,
          };
        } else {
          initial[team.id] = { placement: null, kills: 0 };
        }
      });
      
      setResults(initial);
      setErrors([]);
    }
  }, [match, teams, playingTeams, isOpen]);

  if (!isOpen) return null;

  const actualPlayingTeams = playingTeams || teams.length;
  const playingTeamsList = teams.slice(0, actualPlayingTeams);
  const placementOptions = Array.from({ length: actualPlayingTeams }, (_, i) => i + 1);

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
    
    if (placementValue < 1 || placementValue > actualPlayingTeams) {
      return; // Invalid placement
    }
    
    // Check if placement is already taken
    if (assignedPlacements.has(placementValue)) {
      // Find which team has this placement
      const conflictingTeam = playingTeamsList.find(t => {
        const result = results[t.id];
        return t.id !== teamId && result?.placement === placementValue;
      });
      
      if (conflictingTeam) {
        // Swap placements: give the conflicting team the current team's placement
        const currentPlacement = results[teamId]?.placement;
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
    setErrors([]);
    
    // Validate that all playing teams have placements assigned
    const placements = playingTeamsList
      .map(team => results[team.id]?.placement)
      .filter((p): p is number => p !== null);
    
    if (placements.length !== actualPlayingTeams) {
      setErrors([`All ${actualPlayingTeams} playing teams must have a placement assigned.`]);
      return;
    }
    
    // Validate that all placements are unique (1 to playingTeams)
    const uniquePlacements = new Set(placements);
    if (uniquePlacements.size !== placements.length) {
      setErrors([`Each team must have a unique placement (1-${actualPlayingTeams}).`]);
      return;
    }

    // Validate that all placements from 1 to playingTeams are present
    const sortedPlacements = [...placements].sort((a, b) => a - b);
    const missingPlacements: number[] = [];
    for (let i = 1; i <= actualPlayingTeams; i++) {
      if (!sortedPlacements.includes(i)) {
        missingPlacements.push(i);
      }
    }
    
    if (missingPlacements.length > 0) {
      setErrors([`Missing placements: ${missingPlacements.join(', ')}. All placements from 1-${actualPlayingTeams} must be assigned.`]);
      return;
    }

    const matchResults: MatchResult[] = playingTeamsList.map(team => {
      const result = results[team.id];
      if (result.placement === null) {
        throw new Error('Placement cannot be null at this point');
      }
      return {
        teamId: team.id,
        placement: result.placement,
        kills: result.kills,
        points: calculateMatchPoints(result.placement, result.kills),
      };
    });

    onSave(match.id, matchResults);
  };

  // Sort teams by slot number for display
  const sortedTeams = [...playingTeamsList].sort((a, b) => a.slotNumber - b.slotNumber);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Edit Match {match.matchNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3 mb-4">
            {sortedTeams.map((team) => {
              const result = results[team.id] || { placement: null, kills: 0 };
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
                      <div className="text-xs text-gray-500">
                        {result.placement !== null 
                          ? `${calculateMatchPoints(result.placement, result.kills)} pts`
                          : 'No placement'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Placement</label>
                      <select
                        value={result.placement ?? ''}
                        onChange={(e) => handlePlacementChange(team.id, e.target.value)}
                        className={`w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 ${
                          result.placement === null
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        required
                      >
                        <option value="">Select</option>
                        {placementOptions.map((place) => {
                          const isTaken = assignedPlacements.has(place);
                          const teamWithPlacement = isTaken 
                            ? playingTeamsList.find(t => t.id !== team.id && results[t.id]?.placement === place)
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
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Kills</label>
                      <input
                        type="number"
                        min="0"
                        value={result.kills}
                        onChange={(e) => handleKillsChange(team.id, parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block mb-4">
            <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-700 pb-2 border-b border-gray-300">
              <div className="col-span-2">Slot</div>
              <div className="col-span-3">Team Name</div>
              <div className="col-span-2">Placement</div>
              <div className="col-span-2">Kills</div>
              <div className="col-span-3">Points</div>
            </div>

            {sortedTeams.map((team) => {
              const result = results[team.id] || { placement: null, kills: 0 };
              const assignedPlacements = getAssignedPlacements(team.id);
              const currentMatchPoints = result.placement !== null 
                ? calculateMatchPoints(result.placement, result.kills) 
                : 0;
              
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
                      value={result.placement ?? ''}
                      onChange={(e) => handlePlacementChange(team.id, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 ${
                        result.placement === null
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                      required
                    >
                      <option value="">Select</option>
                      {placementOptions.map((place) => {
                        const isTaken = assignedPlacements.has(place);
                        const teamWithPlacement = isTaken 
                          ? playingTeamsList.find(t => t.id !== team.id && results[t.id]?.placement === place)
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
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      value={result.kills}
                      onChange={(e) => handleKillsChange(team.id, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                      required
                    />
                  </div>
                  <div className="col-span-3 text-sm font-semibold text-blue-600">
                    {currentMatchPoints} pts
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm sm:text-base"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 active:bg-gray-500 transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

