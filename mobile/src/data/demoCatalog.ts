import { ArtworkSource, Playlist, Track } from '@/types/music';

const artwork = {
  chill: require('../../assets/artwork/chill.jpg') as number,
  night: require('../../assets/artwork/night.jpg') as number,
  workout: require('../../assets/artwork/workout.jpg') as number,
  road: require('../../assets/artwork/road.jpg') as number,
  nepal: require('../../assets/artwork/nepal.jpg') as number,
  palm: require('../../assets/artwork/palm.jpg') as number,
  concert: require('../../assets/artwork/concert.jpg') as number,
  portrait: require('../../assets/artwork/portrait.jpg') as number,
  focus: require('../../assets/artwork/focus.jpg') as number,
  acoustic: require('../../assets/artwork/acoustic.jpg') as number,
  guitar: require('../../assets/artwork/guitar.jpg') as number,
  neon: require('../../assets/artwork/neon.jpg') as number,
};

const audio = {
  midnight: require('../../assets/audio/midnight-circuit.wav') as number,
  blue: require('../../assets/audio/blue-hour.wav') as number,
  rain: require('../../assets/audio/signal-rain.wav') as number,
  horizon: require('../../assets/audio/slow-horizon.wav') as number,
};

const DEMO_DURATION = 36;

export const demoTracks: Track[] = [
  {
    id: 'demo:midnight-circuit',
    title: 'Midnight Circuit',
    artist: 'Neon District',
    album: 'After Hours',
    artwork: artwork.neon,
    duration: DEMO_DURATION,
    url: audio.midnight,
    source: 'demo',
    isPlayable: true,
    providerLabel: 'NKfy Sessions',
    genre: 'Electronic',
    year: 2026,
    trackNumber: 1,
  },
  {
    id: 'demo:blue-hour',
    title: 'Blue Hour',
    artist: 'Aria Vale',
    album: 'Blue Hour',
    artwork: artwork.chill,
    duration: DEMO_DURATION,
    url: audio.blue,
    source: 'demo',
    isPlayable: true,
    providerLabel: 'NKfy Sessions',
    genre: 'Chill',
    year: 2026,
    trackNumber: 1,
  },
  {
    id: 'demo:signal-rain',
    title: 'Signal Rain',
    artist: 'Kaito Ren',
    album: 'Night Signals',
    artwork: artwork.night,
    duration: DEMO_DURATION,
    url: audio.rain,
    source: 'demo',
    isPlayable: true,
    providerLabel: 'NKfy Sessions',
    genre: 'Electronic',
    year: 2026,
    trackNumber: 1,
  },
  {
    id: 'demo:slow-horizon',
    title: 'Slow Horizon',
    artist: 'Mira Sol',
    album: 'Quiet Motion',
    artwork: artwork.palm,
    duration: DEMO_DURATION,
    url: audio.horizon,
    source: 'demo',
    isPlayable: true,
    providerLabel: 'NKfy Sessions',
    genre: 'Ambient',
    year: 2026,
    trackNumber: 1,
  },
];

export const demoLyrics: Record<string, string[]> = {
  'demo:midnight-circuit': [
    'City lights are bleeding into blue',
    'Every window hums a different tune',
    'We keep moving till the morning finds us',
    'Midnight circuit, running back to you',
  ],
  'demo:blue-hour': [
    'The sky forgets the colour of the day',
    'A quiet room, a record starts to play',
    'Hold the blue hour, let it stay',
    'Nothing here can take it away',
  ],
  'demo:signal-rain': [
    'Static on the window, soft and low',
    'Signals in the rain, where do they go',
    'Tune the world out, let the rhythm glow',
    'We are louder than the radio',
  ],
  'demo:slow-horizon': [
    'Slow horizon, take your time',
    'Every shoreline draws a line',
    'Breathe it in and let it go',
    'There is nowhere else to go',
  ],
};

export interface CuratedSummary {
  id: string;
  name: string;
  description: string;
  cover?: ArtworkSource;
  query: string;
  accent: string;
  tracks?: Track[];
}

export const demoCurated: CuratedSummary[] = [
  {
    id: 'chill-vibes',
    name: 'Chill Vibes',
    description: 'Relax • Focus • Enjoy',
    cover: artwork.chill,
    query: 'chill',
    accent: '#2F80FF',
    tracks: [demoTracks[1]!, demoTracks[3]!],
  },
  {
    id: 'workout-mix',
    name: 'Workout Mix',
    description: 'Power through the last rep',
    cover: artwork.workout,
    query: 'workout',
    accent: '#8B5CF6',
    tracks: [demoTracks[0]!, demoTracks[2]!],
  },
  {
    id: 'late-night-drive',
    name: 'Late Night Drive',
    description: 'Neon lights and open roads',
    cover: artwork.road,
    query: 'night drive',
    accent: '#F59E0B',
    tracks: [demoTracks[0]!, demoTracks[1]!],
  },
  {
    id: 'focus-flow',
    name: 'Focus Flow',
    description: 'Deep work, no distractions',
    cover: artwork.focus,
    query: 'focus',
    accent: '#10B981',
    tracks: [demoTracks[3]!, demoTracks[2]!],
  },
  {
    id: 'acoustic-sunrise',
    name: 'Acoustic Sunrise',
    description: 'Soft strings for slow mornings',
    cover: artwork.acoustic,
    query: 'acoustic',
    accent: '#EC4899',
    tracks: [demoTracks[1]!],
  },
  {
    id: 'nepali-hits',
    name: 'Nepali Hits',
    description: 'From Kathmandu with love',
    cover: artwork.nepal,
    query: 'nepali',
    accent: '#EF4444',
    tracks: [demoTracks[2]!, demoTracks[0]!],
  },
];

export const demoRecent = [demoTracks[1]!, demoTracks[2]!, demoTracks[0]!];

export function createSeedPlaylists(): Playlist[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'seed:my-playlist',
      name: 'My Playlist',
      description: 'A little bit of everything',
      coverUri: artwork.chill,
      tracks: demoTracks,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed:chill-vibes',
      name: 'Chill Vibes',
      description: 'Relax • Focus • Enjoy',
      coverUri: artwork.chill,
      tracks: [demoTracks[1]!, demoTracks[3]!],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed:workout-mix',
      name: 'Workout Mix',
      description: 'Power through the last rep',
      coverUri: artwork.workout,
      tracks: [demoTracks[0]!, demoTracks[2]!],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export const demoArtists = [
  { id: 'Neon District', name: 'Neon District', artwork: artwork.neon },
  { id: 'Aria Vale', name: 'Aria Vale', artwork: artwork.portrait },
  { id: 'Kaito Ren', name: 'Kaito Ren', artwork: artwork.night },
  { id: 'Mira Sol', name: 'Mira Sol', artwork: artwork.palm },
];

export const artworkAssets = artwork;
