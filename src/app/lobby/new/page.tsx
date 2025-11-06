'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lobby, Team } from '@/lib/types';
import { saveLobby, generateLobbyId } from '@/lib/storage';
import DateInput from '@/components/DateInput';

export default function NewLobbyPage() {
  const router = useRouter();
  const [lobbyName, setLobbyName] = useState('');
  const [lobbyDate, setLobbyDate] = useState(new Date().toISOString().split('T')[0]);
  const [hostNotes, setHostNotes] = useState('');
  const [teams, setTeams] = useState<string[]>(Array(12).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleTeamChange = (index: number, value: string) => {
    const newTeams = [...teams];
    newTeams[index] = value;
    setTeams(newTeams);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];

    if (!lobbyName.trim()) {
      validationErrors.push('Lobby name is required');
    }

    if (!lobbyDate) {
      validationErrors.push('Date is required');
    }

    const validTeams = teams.filter(name => name.trim() !== '');
    if (validTeams.length !== 12) {
      validationErrors.push('Exactly 12 team names are required');
    }

    // Check for duplicate team names
    const teamNames = validTeams.map(name => name.trim().toLowerCase());
    const uniqueNames = new Set(teamNames);
    if (uniqueNames.size !== teamNames.length) {
      validationErrors.push('Team names must be unique');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    // Create lobby
    const lobbyId = generateLobbyId();
    const lobbyTeams: Team[] = validTeams.map((name, index) => ({
      id: `team_${lobbyId}_${index}`,
      lobbyId,
      name: name.trim(),
      slotNumber: index + 1,
    }));

    const newLobby: Lobby = {
      id: lobbyId,
      name: lobbyName.trim(),
      date: lobbyDate,
      status: 'not_started',
      hostNotes: hostNotes.trim() || undefined,
      teams: lobbyTeams,
      matches: [],
      createdAt: new Date().toISOString(),
    };

    try {
      saveLobby(newLobby);
      router.push(`/lobby/${lobbyId}`);
    } catch (error) {
      console.error('Error creating lobby:', error);
      setErrors(['Failed to create lobby. Please try again.']);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create New Lobby</h1>
          <p className="text-sm sm:text-base text-gray-600">Set up a new tournament lobby with 12 teams</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {/* Lobby Info */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Lobby Information</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="lobby-name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Lobby Name *
                </label>
                <input
                  id="lobby-name"
                  type="text"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  placeholder="e.g., Morning Session, Afternoon Batch"
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <DateInput
                  id="lobby-date"
                  value={lobbyDate}
                  onChange={(e) => setLobbyDate(e)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                  label="Date *"
                />
              </div>

              <div>
                <label htmlFor="host-notes" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Host Notes (Optional)
                </label>
                <textarea
                  id="host-notes"
                  value={hostNotes}
                  onChange={(e) => setHostNotes(e.target.value)}
                  placeholder="Any additional notes about this lobby..."
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Teams (12 Required)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {teams.map((team, index) => (
                <div key={index}>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Slot {index + 1} *
                  </label>
                  <input
                    type="text"
                    value={team}
                    onChange={(e) => handleTeamChange(index, e.target.value)}
                    placeholder={`Team ${index + 1} name`}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
              <ul className="list-disc list-inside text-xs sm:text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSubmitting ? 'Creating...' : 'Create Lobby'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

