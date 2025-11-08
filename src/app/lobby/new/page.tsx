'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lobby, Team } from '@/lib/types';
import { saveLobby, generateLobbyId } from '@/lib/storage';
import { BackgroundTemplate } from '@/lib/backgroundTemplates';
import DateInput from '@/components/DateInput';

export default function NewLobbyPage() {
  const router = useRouter();
  const [lobbyName, setLobbyName] = useState('');
  const [lobbyDate, setLobbyDate] = useState(new Date().toISOString().split('T')[0]);
  const [hostNotes, setHostNotes] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [prizeMoney, setPrizeMoney] = useState('');
  const [tournamentStage, setTournamentStage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [matchesCount, setMatchesCount] = useState<number>(6);
  const [registeredTeams, setRegisteredTeams] = useState<number>(12);
  const [playingTeams, setPlayingTeams] = useState<number>(12);
  const [templates, setTemplates] = useState<BackgroundTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [teams, setTeams] = useState<string[]>(Array(12).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/backgrounds');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        } else {
          console.error('Failed to fetch templates');
          setErrors(['Failed to load background templates. Please refresh the page.']);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        setErrors(['Failed to load background templates. Please refresh the page.']);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleTeamChange = (index: number, value: string) => {
    const newTeams = [...teams];
    newTeams[index] = value;
    setTeams(newTeams);
  };

  // Update teams array when registeredTeams changes
  useEffect(() => {
    if (registeredTeams > teams.length) {
      // Add empty slots
      setTeams(prevTeams => [...prevTeams, ...Array(registeredTeams - prevTeams.length).fill('')]);
    } else if (registeredTeams < teams.length) {
      // Remove extra slots
      setTeams(prevTeams => prevTeams.slice(0, registeredTeams));
    }
    // Ensure playingTeams doesn't exceed registeredTeams
    if (playingTeams > registeredTeams) {
      setPlayingTeams(registeredTeams);
    }
  }, [registeredTeams, playingTeams, teams.length]);

  // Ensure playingTeams doesn't exceed registeredTeams
  useEffect(() => {
    if (playingTeams > registeredTeams) {
      setPlayingTeams(registeredTeams);
    }
  }, [playingTeams, registeredTeams]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!tournamentName.trim()) {
      validationErrors.push('Tournament name is required');
    }

    if (!tournamentStage.trim()) {
      validationErrors.push('Tournament stage is required');
    }

    if (!selectedTemplate) {
      validationErrors.push('Background template is required');
    }

    if (matchesCount < 1 || matchesCount > 20) {
      validationErrors.push('Number of matches must be between 1 and 20');
    }

    if (registeredTeams < 2 || registeredTeams > 50) {
      validationErrors.push('Number of registered teams must be between 2 and 50');
    }

    if (playingTeams < 2 || playingTeams > registeredTeams) {
      validationErrors.push(`Number of playing teams must be between 2 and ${registeredTeams}`);
    }

    // Only validate that playing teams have names (not all registered teams)
    const validTeams = teams.filter(name => name.trim() !== '');
    if (validTeams.length < playingTeams) {
      validationErrors.push(`At least ${playingTeams} team names are required (for teams playing)`);
    }
    
    // Check for duplicate team names (only among valid teams)
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

    try {
      // Create lobby
      const lobbyId = await generateLobbyId();
      
      // Only create teams for teams that have names (at least playingTeams must have names)
      const validTeams = teams.filter(name => name.trim() !== '');
      // Ensure we have at least playingTeams teams, but don't create empty teams
      const teamsToCreate = Math.max(playingTeams, validTeams.length);
      
      const lobbyTeams: Team[] = [];
      for (let i = 0; i < teamsToCreate; i++) {
        const teamName = teams[i]?.trim() || (i < playingTeams ? `Team ${i + 1}` : '');
        if (teamName) {
          lobbyTeams.push({
            id: `team_${lobbyId}_${i}`,
            lobbyId,
            name: teamName,
            slotNumber: i + 1,
          });
        }
      }

      const newLobby: Lobby = {
        id: lobbyId,
        name: lobbyName.trim(),
        date: lobbyDate,
        status: 'not_started',
        hostNotes: hostNotes.trim() || undefined,
        tournamentName: tournamentName.trim(),
        prizeMoney: prizeMoney.trim() || undefined,
        tournamentStage: tournamentStage.trim(),
        backgroundTemplate: selectedTemplate,
        matchesCount: matchesCount,
        registeredTeams: registeredTeams,
        playingTeams: playingTeams,
        teams: lobbyTeams,
        matches: [],
        createdAt: new Date().toISOString(),
      };

      await saveLobby(newLobby);
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
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Image 
              src="/logo.png" 
              alt="4DL Logo" 
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              priority
            />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Create New Lobby</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Set up a new tournament lobby with configurable teams and matches</p>
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
                <label htmlFor="tournament-name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Tournament Name *
                </label>
                <input
                  id="tournament-name"
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="e.g., Battle of Crown"
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="prize-money" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Prize Money
                  </label>
                  <input
                    id="prize-money"
                    type="text"
                    value={prizeMoney}
                    onChange={(e) => setPrizeMoney(e.target.value)}
                    placeholder="e.g., 3K"
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="tournament-stage" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Tournament Stage *
                  </label>
                  <select
                    id="tournament-stage"
                    value={tournamentStage}
                    onChange={(e) => setTournamentStage(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                    required
                  >
                    <option value="">Select Stage</option>
                    <option value="Quarters">Quarters</option>
                    <option value="Semi-Finals">Semi-Finals</option>
                    <option value="Finals">Finals</option>
                    <option value="Grand Finals">Grand Finals</option>
                  </select>
                </div>
              </div>

              {/* Tournament Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="matches-count" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Number of Matches *
                  </label>
                  <input
                    id="matches-count"
                    type="number"
                    min={1}
                    max={20}
                    value={matchesCount}
                    onChange={(e) => setMatchesCount(parseInt(e.target.value) || 6)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Default: 6</p>
                </div>

                <div>
                  <label htmlFor="registered-teams" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Registered Teams *
                  </label>
                  <input
                    id="registered-teams"
                    type="number"
                    min={2}
                    max={50}
                    value={registeredTeams}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 12;
                      setRegisteredTeams(val);
                      if (playingTeams > val) {
                        setPlayingTeams(val);
                      }
                    }}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Total teams registered</p>
                </div>

                <div>
                  <label htmlFor="playing-teams" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Teams Playing *
                  </label>
                  <input
                    id="playing-teams"
                    type="number"
                    min={2}
                    max={registeredTeams}
                    value={playingTeams}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || registeredTeams;
                      setPlayingTeams(Math.min(val, registeredTeams));
                    }}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Max: {registeredTeams}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Background Template *
                </label>
                {isLoadingTemplates ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading templates...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-red-500">
                    No templates found. Please add template images to the backgrounds folder.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                            selectedTemplate === template.id
                              ? 'border-blue-600 ring-2 ring-blue-500 ring-offset-2'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gray-100">
                            {template.id === 'black' || !template.previewUrl ? (
                              <div className="absolute inset-0 bg-black" />
                            ) : (
                              <Image
                                src={template.previewUrl}
                                alt={template.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              />
                            )}
                          </div>
                          <div className="p-2 sm:p-3 bg-white rounded-b-lg">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 text-center">
                              {template.name}
                            </p>
                            {template.description && (
                              <p className="text-xs text-gray-500 text-center mt-1 hidden sm:block">
                                {template.description}
                              </p>
                            )}
                          </div>
                          {selectedTemplate === template.id && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {!selectedTemplate && (
                      <p className="mt-2 text-xs text-red-600">Please select a background template</p>
                    )}
                  </>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Choose a background template for the leaderboard export
                </p>
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
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">
              Teams ({playingTeams} Required, {registeredTeams} Max)
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-3">
              Enter at least {playingTeams} team names. You can add up to {registeredTeams} teams total.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {teams.slice(0, Math.max(playingTeams, registeredTeams)).map((team, index) => (
                <div key={index}>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Slot {index + 1} {index < playingTeams ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={team}
                    onChange={(e) => handleTeamChange(index, e.target.value)}
                    placeholder={`Team ${index + 1} name`}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-gray-900 bg-white"
                    required={index < playingTeams}
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

