'use client';

import Link from 'next/link';
import { Lobby } from '@/lib/types';
import { getLobbyStatus, calculateLeaderboard } from '@/lib/scoring';

interface LobbyCardProps {
  lobby: Lobby;
  onDelete: (id: string) => void;
}

export default function LobbyCard({ lobby, onDelete }: LobbyCardProps) {
  const status = getLobbyStatus(lobby.matches);
  const leaderboard = calculateLeaderboard(lobby.teams, lobby.matches);
  const winner = leaderboard[0];
  const matchesCompleted = lobby.matches.length;

  const statusColors = {
    not_started: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{lobby.name}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Date: {lobby.date}</p>
          <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        <div className="flex gap-2 sm:flex-shrink-0">
          <Link
            href={`/lobby/${lobby.id}`}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors text-xs sm:text-sm font-medium text-center"
          >
            View
          </Link>
          <button
            onClick={() => onDelete(lobby.id)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 transition-colors text-xs sm:text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
        <div>
          <span className="text-gray-600">Matches:</span>
          <span className="ml-2 font-semibold">{matchesCompleted}/6</span>
        </div>
        <div>
          <span className="text-gray-600">Teams:</span>
          <span className="ml-2 font-semibold">{lobby.teams.length}</span>
        </div>
        {winner && (
          <div className="col-span-2">
            <span className="text-gray-600">Current Leader:</span>
            <span className="ml-2 font-semibold text-green-600 break-words">
              {winner.teamName} ({winner.totalPoints} pts)
            </span>
          </div>
        )}
      </div>

      {lobby.hostNotes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600 break-words">
            <span className="font-semibold">Notes:</span> {lobby.hostNotes}
          </p>
        </div>
      )}
    </div>
  );
}

