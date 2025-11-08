import useSWR from 'swr';
import { getLobby, getAllLobbies, getLobbiesByDate } from '@/lib/storage';
import { Lobby } from '@/lib/types';

/**
 * SWR hook for fetching a single lobby
 * Automatically caches and deduplicates requests
 */
export function useLobby(id: string | null) {
  return useSWR(
    id ? ['lobby', id] : null,
    () => getLobby(id!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 seconds - prevent duplicate requests
      revalidateIfStale: false, // Don't revalidate if data is fresh
    }
  );
}

/**
 * SWR hook for fetching all lobbies
 */
export function useAllLobbies() {
  return useSWR(
    'all-lobbies',
    getAllLobbies,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      revalidateIfStale: false,
    }
  );
}

/**
 * SWR hook for fetching lobbies by date
 */
export function useLobbiesByDate(date: string | null) {
  return useSWR(
    date ? ['lobbies-by-date', date] : null,
    () => getLobbiesByDate(date!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      revalidateIfStale: false,
    }
  );
}

