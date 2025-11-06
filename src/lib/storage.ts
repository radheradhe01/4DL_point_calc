import { Lobby } from './types';
import { isLocalStorageAvailable } from '@/utils/compatibility';

const STORAGE_KEY = 'freefire_tournaments';

/**
 * Get all lobbies from localStorage
 */
export function getAllLobbies(): Lobby[] {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) {
    return [];
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as Lobby[];
  } catch (error) {
    console.error('Error reading lobbies from storage:', error);
    return [];
  }
}

/**
 * Get a single lobby by ID
 */
export function getLobby(id: string): Lobby | null {
  const lobbies = getAllLobbies();
  return lobbies.find(lobby => lobby.id === id) || null;
}

/**
 * Save a lobby (create or update)
 */
export function saveLobby(lobby: Lobby): void {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) {
    console.warn('localStorage is not available. Data will not be saved.');
    return;
  }
  
  try {
    const lobbies = getAllLobbies();
    const index = lobbies.findIndex(l => l.id === lobby.id);
    
    if (index >= 0) {
      lobbies[index] = lobby;
    } else {
      lobbies.push(lobby);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lobbies));
  } catch (error) {
    console.error('Error saving lobby to storage:', error);
    // Check if quota exceeded
    if (error instanceof DOMException && error.code === 22) {
      throw new Error('Storage quota exceeded. Please clear some data.');
    }
    throw error;
  }
}

/**
 * Delete a lobby by ID
 */
export function deleteLobby(id: string): void {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) {
    return;
  }
  
  try {
    const lobbies = getAllLobbies();
    const filtered = lobbies.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting lobby from storage:', error);
    throw error;
  }
}

/**
 * Get lobbies filtered by date
 */
export function getLobbiesByDate(date: string): Lobby[] {
  const lobbies = getAllLobbies();
  return lobbies.filter(lobby => lobby.date === date);
}

/**
 * Generate a unique ID for new lobbies
 */
export function generateLobbyId(): string {
  return `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

