'use client';

import { LeaderboardEntry } from '@/lib/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 border-gray-300';
    if (rank === 3) return 'bg-orange-100 border-orange-300';
    return 'bg-white border-gray-200';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Leaderboard</h2>
      </div>
      
      {/* Mobile Card View */}
      <div className="block sm:hidden divide-y divide-gray-200">
        {entries.map((entry) => (
          <div
            key={entry.teamId}
            className={`p-4 border-l-4 ${getRankColor(entry.rank)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {entry.rank}
                </span>
                {getRankIcon(entry.rank) && (
                  <span className="text-xl">{getRankIcon(entry.rank)}</span>
                )}
                <span className="text-sm font-medium text-gray-900">
                  {entry.teamName}
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {entry.totalPoints}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div>
                <span className="text-gray-500">Slot:</span> #{entry.slotNumber}
              </div>
              <div>
                <span className="text-gray-500">Booyahs:</span> {entry.booyahs}
              </div>
              <div>
                <span className="text-gray-500">Kills:</span> {entry.totalKills}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Placement Pts: {entry.totalPlacementPoints}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team Name
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slot
              </th>
              <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Points
              </th>
              <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booyahs
              </th>
              <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Kills
              </th>
              <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Placement Pts
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr
                key={entry.teamId}
                className={`hover:bg-gray-50 transition-colors border-l-4 ${getRankColor(entry.rank)}`}
              >
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-900">
                      {entry.rank}
                    </span>
                    {getRankIcon(entry.rank) && (
                      <span className="ml-2 text-xl">{getRankIcon(entry.rank)}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.teamName}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">#{entry.slotNumber}</div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {entry.totalPoints}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-600">{entry.booyahs}</div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-600">{entry.totalKills}</div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-600">{entry.totalPlacementPoints}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

