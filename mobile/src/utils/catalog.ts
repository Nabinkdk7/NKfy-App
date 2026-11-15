import { AlbumSummary, ArtistSummary, Track } from '@/types/music';
import { demoTracks } from '@/data/demoCatalog';

export function albumKey(track: Track): string {
  return encodeURIComponent(`${track.album ?? 'Single'}::${track.artist}`);
}

export function artistKey(name: string): string {
  return encodeURIComponent(name);
}

export function groupAlbums(tracks: Track[]): AlbumSummary[] {
  const map = new Map<string, AlbumSummary>();
  for (const track of tracks) {
    const key = albumKey(track);
    const existing = map.get(key);
    if (existing) {
      existing.tracks.push(track);
      existing.artwork = existing.artwork ?? track.artwork;
    } else {
      map.set(key, {
        id: key,
        title: track.album || 'Single',
        artist: track.artist,
        artwork: track.artwork,
        year: track.year,
        tracks: [track],
      });
    }
  }
  return [...map.values()].map((album) => ({
    ...album,
    tracks: [...album.tracks].sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0)),
  }));
}

export function groupArtists(tracks: Track[]): ArtistSummary[] {
  const map = new Map<string, ArtistSummary>();
  for (const track of tracks) {
    const key = artistKey(track.artist);
    const existing = map.get(key);
    if (existing) {
      if (!existing.tracks.some((item) => item.id === track.id)) existing.tracks.push(track);
      existing.artwork = existing.artwork ?? track.artwork;
    } else {
      map.set(key, {
        id: key,
        name: track.artist,
        artwork: track.artwork,
        tracks: [track],
        albums: [],
      });
    }
  }
  return [...map.values()].map((artist) => ({
    ...artist,
    albums: groupAlbums(artist.tracks),
    followers: undefined,
    verified: artist.tracks.some((track) => track.source === 'audius' || track.source === 'demo'),
  }));
}

export function findAlbum(id: string, tracks: Track[]): AlbumSummary | undefined {
  return groupAlbums([...tracks, ...demoTracks]).find((album) => album.id === id);
}

export function findArtist(id: string, tracks: Track[]): ArtistSummary | undefined {
  return groupArtists([...tracks, ...demoTracks]).find((artist) => artist.id === id);
}

export function folderGroups(tracks: Track[]) {
  const map = new Map<string, { path: string; name: string; tracks: Track[] }>();
  for (const track of tracks) {
    const path = track.folder || track.album || 'Unknown folder';
    const existing = map.get(path);
    if (existing) existing.tracks.push(track);
    else map.set(path, { path, name: path.split('/').filter(Boolean).pop() || path, tracks: [track] });
  }
  return [...map.values()]
    .map((folder) => ({ ...folder, trackCount: folder.tracks.length }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
