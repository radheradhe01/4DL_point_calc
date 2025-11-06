'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lobby } from '@/lib/types';
import { getAllLobbies, deleteLobby, getLobbiesByDate } from '@/lib/storage';
import LobbyCard from '@/components/LobbyCard';
import { exportDailySummary } from '@/utils/export';
import DateInput from '@/components/DateInput';

export default function Home() {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [filteredLobbies, setFilteredLobbies] = useState<Lobby[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadLobbies();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const filtered = getLobbiesByDate(selectedDate);
      setFilteredLobbies(filtered);
    } else {
      setFilteredLobbies(lobbies);
    }
  }, [selectedDate, lobbies]);

  const loadLobbies = () => {
    const allLobbies = getAllLobbies();
    setLobbies(allLobbies);
    setFilteredLobbies(allLobbies);
  };

  const handleDelete = (id: string) => {
    if (showDeleteConfirm === id) {
      deleteLobby(id);
      loadLobbies();
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(id);
    }
  };

  const handleExportDaily = () => {
    if (!selectedDate) {
      alert('Please select a date first');
      return;
    }
    const dailyLobbies = getLobbiesByDate(selectedDate);
    if (dailyLobbies.length === 0) {
      alert('No lobbies found for selected date');
      return;
    }
    exportDailySummary(dailyLobbies, selectedDate);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <main className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Free Fire Tournament Manager
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage multiple tournament lobbies with independent leaderboards
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <Link
              href="/lobby/new"
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-center sm:text-left"
            >
              + Create New Lobby
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <DateInput
                id="date-filter"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e)}
                max={today}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                label="Filter by Date:"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 active:text-gray-700 border border-gray-300 rounded-md sm:border-0"
                >
                  Clear
                </button>
              )}
            </div>

            {selectedDate && filteredLobbies.length > 0 && (
              <button
                onClick={handleExportDaily}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors font-medium text-center sm:text-left"
              >
                Export Daily Summary
              </button>
            )}
          </div>
        </div>

        {/* Lobbies Grid */}
        {filteredLobbies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-12 text-center">
            <p className="text-lg sm:text-xl text-gray-600 mb-4">
              {selectedDate ? 'No lobbies found for selected date' : 'No lobbies created yet'}
            </p>
            <Link
              href="/lobby/new"
              className="inline-block px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm sm:text-base"
            >
              Create Your First Lobby
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredLobbies.map((lobby) => (
              <LobbyCard
                key={lobby.id}
                lobby={lobby}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Confirm Delete</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Are you sure you want to delete this lobby? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
