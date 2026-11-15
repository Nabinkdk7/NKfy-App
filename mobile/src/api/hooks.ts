import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { api } from '@/api/client';
import { toPlaylist, toTrack } from '@/api/mappers';

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

export function useHomeFeed() {
  return useQuery({
    queryKey: ['home'],
    queryFn: async () => {
      const feed = await api.home();
      return {
        featured: feed.featured ? toPlaylist(feed.featured) : null,
        curated: (feed.curated ?? []).map(toPlaylist),
        trending: (feed.trending ?? []).map(toTrack),
        genres: feed.genres ?? [],
        providers: feed.providers,
        degraded: feed.degraded,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useSearchResults(query: string, enabled = true) {
  const debounced = useDebouncedValue(query.trim(), 400);
  return useQuery({
    queryKey: ['search', debounced],
    queryFn: async () => {
      const results = await api.search(debounced, 24);
      return {
        tracks: results.tracks.map(toTrack),
        youtube: results.youtube.map(toTrack),
      };
    },
    enabled: enabled && debounced.length > 1,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });
}

export function useCuratedPlaylist(id: string | undefined) {
  return useQuery({
    queryKey: ['curated', id],
    queryFn: async () => {
      const payload = await api.curated(id!);
      return {
        playlist: toPlaylist(payload.playlist),
        tracks: payload.tracks.map(toTrack),
      };
    },
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useTrending(genre: string | undefined) {
  return useQuery({
    queryKey: ['trending', genre ?? 'all'],
    queryFn: async () => {
      const payload = await api.trending(genre);
      return payload.tracks.map(toTrack);
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
