import type { CuratedPlaylist } from '../types.js';

export const curatedPlaylists: CuratedPlaylist[] = [
  {
    id: 'chill-vibes',
    name: 'Chill Vibes',
    description: 'Relax • Focus • Enjoy',
    coverUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
    query: 'chill',
    accent: '#2F80FF',
  },
  {
    id: 'workout-mix',
    name: 'Workout Mix',
    description: 'Power through the last rep',
    coverUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
    query: 'workout',
    accent: '#8B5CF6',
  },
  {
    id: 'late-night-drive',
    name: 'Late Night Drive',
    description: 'Neon lights and open roads',
    coverUrl:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80',
    query: 'night drive',
    accent: '#F59E0B',
  },
  {
    id: 'focus-flow',
    name: 'Focus Flow',
    description: 'Deep work, no distractions',
    coverUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
    query: 'focus',
    accent: '#10B981',
  },
  {
    id: 'acoustic-sunrise',
    name: 'Acoustic Sunrise',
    description: 'Soft strings for slow mornings',
    coverUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    query: 'acoustic',
    accent: '#EC4899',
  },
  {
    id: 'nepali-hits',
    name: 'Nepali Hits',
    description: 'From Kathmandu with love',
    coverUrl:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80',
    query: 'nepali',
    accent: '#EF4444',
  },
];

export const genres = [
  { id: 'pop', name: 'Pop', color: '#2F80FF', icon: 'star' },
  { id: 'hip-hop', name: 'Hip-Hop', color: '#2563EB', icon: 'headphones' },
  { id: 'rock', name: 'Rock', color: '#7C3AED', icon: 'guitar' },
  { id: 'electronic', name: 'Electronic', color: '#0EA5E9', icon: 'pulse' },
  { id: 'chill', name: 'Chill', color: '#10B981', icon: 'leaf' },
  { id: 'jazz', name: 'Jazz', color: '#F59E0B', icon: 'moon' },
] as const;
