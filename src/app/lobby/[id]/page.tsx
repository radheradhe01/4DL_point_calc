'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lobby, MatchResult } from '@/lib/types';
import { getLobby, saveLobby } from '@/lib/storage';
import { calculateLeaderboard, getCurrentMatchNumber, isLobbyCompleted, getLobbyStatus } from '@/lib/scoring';
import { exportLobbyToCSV, exportLobbyToPDF, exportLeaderboardAsImage } from '@/utils/export';
import MatchEntry from '@/components/MatchEntry';
import Leaderboard from '@/components/Leaderboard';
import MatchHistory from '@/components/MatchHistory';

export default function LobbyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.id as string;
  
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const loadLobby = async () => {
    setIsLoading(true);
    try {
      const loadedLobby = await getLobby(lobbyId);
      if (!loadedLobby) {
        router.push('/');
        return;
      }
      setLobby(loadedLobby);
    } catch (error) {
      console.error('Error loading lobby:', error);
      alert('Failed to load lobby. Please try again.');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLobby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleSaveMatch = async (results: MatchResult[]) => {
    if (!lobby) return;

    setIsSaving(true);

    const currentMatchNum = getCurrentMatchNumber(lobby.matches);
    const newMatch = {
      id: `match_${lobby.id}_${currentMatchNum}`,
      lobbyId: lobby.id,
      matchNumber: currentMatchNum,
      results,
      createdAt: new Date().toISOString(),
    };

    const updatedLobby: Lobby = {
      ...lobby,
      matches: [...lobby.matches, newMatch],
      status: getLobbyStatus([...lobby.matches, newMatch]),
    };

    try {
      await saveLobby(updatedLobby);
      setLobby(updatedLobby);
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Failed to save match. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (lobby) {
      exportLobbyToCSV(lobby);
      setShowExportMenu(false);
    }
  };

  const handleExportPDF = async () => {
    if (lobby) {
      await exportLobbyToPDF(lobby);
      setShowExportMenu(false);
    }
  };

  const handleExportImage = async () => {
    if (lobby) {
      try {
        await exportLeaderboardAsImage(lobby);
        setShowExportMenu(false);
      } catch (error) {
        console.error('Error exporting image:', error);
        alert('Failed to export image. Please try again.');
      }
    }
  };

  if (!lobby) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-gray-600">Loading lobby...</p>
          </div>
        </div>
      </main>
    );
  }

  const leaderboard = calculateLeaderboard(lobby.teams, lobby.matches);
  const currentMatchNum = getCurrentMatchNumber(lobby.matches);
  const completed = isLobbyCompleted(lobby.matches);

  return (
    <main className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 active:text-blue-900 mb-3 sm:mb-4 inline-block text-sm sm:text-base"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <Image 
                  src="/logo.png" 
                  alt="4DL Logo" 
                  width={40}
                  height={40}
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0"
                />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 break-words">{lobby.name}</h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600">Date: {lobby.date}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Status: <span className="font-semibold capitalize">{lobby.status}</span> | 
                Matches: {lobby.matches.length}/6
              </p>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <div className="relative export-menu-container">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors font-medium text-sm sm:text-base"
                >
                  Export ▼
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 sm:right-auto mt-2 w-full sm:w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={handleExportCSV}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={handleExportImage}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm border-t border-gray-200"
                    >
                      Export as Image (PNG)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {lobby.hostNotes && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs sm:text-sm text-gray-700 break-words">
                <span className="font-semibold">Notes:</span> {lobby.hostNotes}
              </p>
            </div>
          )}
        </div>

        {/* Match Entry */}
        {!completed && (
          <div className="mb-4 sm:mb-6">
            <MatchEntry
              teams={lobby.teams}
              currentMatchNumber={currentMatchNum}
              previousMatches={lobby.matches}
              onSave={handleSaveMatch}
              isLoading={isSaving}
            />
          </div>
        )}

        {completed && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <p className="text-sm sm:text-base text-green-800 font-semibold text-center">
              🎉 All 6 matches completed! Tournament finished.
            </p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="mb-4 sm:mb-6">
          <Leaderboard entries={leaderboard} />
        </div>

        {/* Match History */}
        <div>
          <MatchHistory matches={lobby.matches} teams={lobby.teams} />
        </div>
      </div>
    </main>
  );
}

