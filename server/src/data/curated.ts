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
  {
    id: 'nepali-pop',
    name: 'Nepali Pop',
    description: 'Modern Nepali radio',
    coverUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
    query: 'Nepali pop',
    accent: '#F97316',
  },
  {
    id: 'nepali-folk',
    name: 'Nepali Folk',
    description: 'Tradition and Karaoke',
    coverUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    query: 'Nepali folk',
    accent: '#10B981',
  },
  {
    id: 'nepali-hiphop',
    name: 'Nepali Hip-Hop',
    description: 'Rap battles and trap',
    coverUrl:
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=900&q=80',
    query: 'Nepali hip-hop',
    accent: '#2563EB',
  },
  {
    id: 'nepali-rock',
    name: 'Nepali Rock',
    description: 'Loud guitars, big choruses',
    coverUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
    query: 'Nepali rock',
    accent: '#7C3AED',
  },
  {
    id: 'nepali-old-songs',
    name: 'Nepali Old Songs',
    description: 'Golden era classics',
    coverUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    query: 'Nepali old song',
    accent: '#A855F7',
  },
  {
    id: 'nepali-viral',
    name: 'Nepali Viral',
    description: 'What everyone is listening to',
    coverUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
    query: 'Nepali viral',
    accent: '#EC4899',
  },
  {
    id: 'hindi-hits',
    name: 'Hindi Hits',
    description: 'Bollywood and beyond',
    coverUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
    query: 'Hindi',
    accent: '#F59E0B',
  },
  {
    id: 'english-hits',
    name: 'English Hits',
    description: 'Global chart toppers',
    coverUrl:
      'https://images.unsplash.com/photo-1471477332554-29a9cda20671?auto=format&fit=crop&w=900&q=80',
    query: 'english pop',
    accent: '#0EA5E9',
  },
  {
    id: 'metal-hits',
    name: 'Metal',
    description: 'Heavy riffs and screams',
    coverUrl:
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=900&q=80',
    query: 'metal',
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
