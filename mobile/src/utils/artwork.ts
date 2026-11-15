import type { ImageSource } from 'expo-image';
import { Image } from 'react-native';

import { ArtworkSource } from '@/types/music';

export function resolveArtworkUri(artwork?: ArtworkSource): string | undefined {
  if (artwork === undefined || artwork === null) return undefined;
  if (typeof artwork === 'string') return artwork;
  if (typeof artwork === 'number') {
    try {
      return Image.resolveAssetSource(artwork)?.uri;
    } catch {
      return undefined;
    }
  }
  // On web a required asset is a module object with a `uri` instead of a number.
  const candidate = artwork as unknown as { uri?: string; default?: string };
  return candidate.uri ?? candidate.default;
}

export function artworkSource(
  artwork?: ArtworkSource,
  fallback?: ArtworkSource
): ImageSource | number | string | undefined {
  const value = artwork ?? fallback;
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return { uri: value };
  if (typeof value === 'number') return value;

  const uri = resolveArtworkUri(value);
  return uri ? { uri } : undefined;
}

export function firstArtwork(
  ...tracks: { artwork?: ArtworkSource }[]
): ArtworkSource | undefined {
  return tracks.find((track) => Boolean(track.artwork))?.artwork;
}
