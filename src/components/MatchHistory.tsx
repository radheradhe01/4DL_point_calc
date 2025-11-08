'use client';

import { Match, Team } from '@/lib/types';

interface MatchHistoryProps {
  matches: Match[];
  teams: Team[];
  onEditMatch?: (match: Match) => void;
}

export default function MatchHistory({ matches, teams, onEditMatch }: MatchHistoryProps) {
  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown';
  };

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">Match History</h2>
        <p className="text-sm sm:text-base text-gray-500">No matches played yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">Match History</h2>
      <div className="space-y-3 sm:space-y-4">
        {matches.map((match) => {
          const sortedResults = [...match.results].sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999));
          
          return (
            <div key={match.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Match {match.matchNumber}
                </h3>
                <div className="flex items-center gap-2">
                  {onEditMatch && (
                    <button
                      onClick={() => onEditMatch(match)}
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 active:bg-yellow-700 transition-colors font-medium"
                      title="Edit match results"
                    >
                      Edit
                    </button>
                  )}
                  <span className="text-xs sm:text-sm text-gray-500">
                    {new Date(match.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-2">
                {sortedResults.slice(0, 3).map((result) => {
                  const teamName = getTeamName(result.teamId);
                  const placementPoints = result.points - result.kills;
                  
                  return (
                    <div
                      key={result.teamId}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-base font-medium flex-shrink-0">
                          {result.placement === null ? '-' : result.placement === 1 ? '🥇' : result.placement === 2 ? '🥈' : result.placement === 3 ? '🥉' : result.placement}
                        </span>
                        <span className="text-xs font-medium text-gray-900 truncate">
                          {teamName}
                          {result.placement === null && <span className="text-gray-500 ml-1">(Not Played)</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600">{result.kills}K</span>
                        <span className="text-gray-600">{placementPoints}P</span>
                        <span className="font-semibold text-blue-600">{result.points}</span>
                      </div>
                    </div>
                  );
                })}
                {sortedResults.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    +{sortedResults.length - 3} more teams
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 pb-2 border-b border-gray-200">
                  <div className="col-span-1">Place</div>
                  <div className="col-span-5">Team</div>
                  <div className="col-span-2 text-right">Kills</div>
                  <div className="col-span-2 text-right">Placement Pts</div>
                  <div className="col-span-2 text-right">Total Pts</div>
                </div>
                <div className="space-y-1">
                  {sortedResults.map((result) => {
                    const teamName = getTeamName(result.teamId);
                    const placementPoints = result.points - result.kills;
                    
                    return (
                      <div
                        key={result.teamId}
                        className="grid grid-cols-12 gap-2 text-sm py-1 hover:bg-gray-50 rounded"
                      >
                        <div className="col-span-1 font-medium">
                          {result.placement === null ? '-' : result.placement === 1 ? '🥇' : result.placement === 2 ? '🥈' : result.placement === 3 ? '🥉' : result.placement}
                        </div>
                        <div className="col-span-5 text-gray-900">
                          {teamName}
                          {result.placement === null && <span className="text-xs text-gray-500 ml-2">(Not Played)</span>}
                        </div>
                        <div className="col-span-2 text-right text-gray-600">{result.kills}</div>
                        <div className="col-span-2 text-right text-gray-600">{placementPoints}</div>
                        <div className="col-span-2 text-right font-semibold text-blue-600">{result.points}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

