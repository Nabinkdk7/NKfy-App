import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { ApiError, api, type ApiUser } from '@/api/client';
import type { User } from '@/types/music';

const TOKEN_KEY = 'nkfy.auth.token';
const GUEST_PROFILE_KEY = 'nkfy.guest.profile';

interface GuestProfile {
  displayName: string;
  avatar: string;
  createdAt: string;
}

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: User | null;
  error: string | null;
  busy: boolean;
  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  signInAsGuest: (displayName?: string, avatar?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<boolean>;
  updateAvatar: (avatar: string) => Promise<boolean>;
  clearError: () => void;
}

async function saveToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function readToken(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

function toUser(user: ApiUser): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  token: null,
  user: null,
  error: null,
  busy: false,

  restore: async () => {
    try {
      const token = await readToken();
      if (!token) {
        // Restore a locally-saved guest profile if present.
        const raw = await AsyncStorage.getItem(GUEST_PROFILE_KEY);
        if (raw) {
          const profile = JSON.parse(raw) as GuestProfile;
          set({
            status: 'signedIn',
            token: null,
            user: {
              id: 'guest',
              email: '',
              displayName: profile.displayName,
              avatar: profile.avatar,
              createdAt: profile.createdAt,
              isGuest: true,
            },
            error: null,
          });
          return;
        }
        set({ status: 'signedOut', token: null, user: null });
        return;
      }
      const { user } = await api.me(token);
      set({ status: 'signedIn', token, user: toUser(user), error: null });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await saveToken(null);
        set({ status: 'signedOut', token: null, user: null });
        return;
      }
      set({ status: 'signedOut', token: null, user: null });
    }
  },

  signIn: async (email, password) => {
    set({ busy: true, error: null });
    try {
      const session = await api.login(email.trim(), password);
      await saveToken(session.token);
      set({
        status: 'signedIn',
        token: session.token,
        user: toUser(session.user),
        busy: false,
      });
      return true;
    } catch (error) {
      set({
        busy: false,
        error: error instanceof ApiError ? error.message : 'Unable to sign in right now',
      });
      return false;
    }
  },

  signUp: async (email, password, displayName) => {
    set({ busy: true, error: null });
    try {
      const session = await api.register(email.trim(), password, displayName.trim());
      await saveToken(session.token);
      set({
        status: 'signedIn',
        token: session.token,
        user: toUser(session.user),
        busy: false,
      });
      return true;
    } catch (error) {
      set({
        busy: false,
        error: error instanceof ApiError ? error.message : 'Unable to create the account',
      });
      return false;
    }
  },

  signInAsGuest: async (displayName = 'Guest', avatar = '🎵') => {
    const profile: GuestProfile = {
      displayName: displayName.trim() || 'Guest',
      avatar,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
    set({
      status: 'signedIn',
      token: null,
      user: {
        id: 'guest',
        email: '',
        displayName: profile.displayName,
        avatar: profile.avatar,
        createdAt: profile.createdAt,
        isGuest: true,
      },
      error: null,
      busy: false,
    });
  },

  signOut: async () => {
    await saveToken(null);
    await AsyncStorage.removeItem(GUEST_PROFILE_KEY);
    set({ status: 'signedOut', token: null, user: null, error: null });
  },

  updateDisplayName: async (displayName) => {
    const user = get().user;
    if (user?.isGuest) {
      const trimmed = displayName.trim() || 'Guest';
      const profile: GuestProfile = {
        displayName: trimmed,
        avatar: user.avatar ?? '🎵',
        createdAt: user.createdAt,
      };
      await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
      set({ user: { ...user, displayName: trimmed } });
      return true;
    }
    const token = get().token;
    if (!token) return false;
    try {
      const { user: updated } = await api.updateProfile(token, displayName.trim());
      set({ user: toUser(updated) });
      return true;
    } catch (error) {
      set({ error: error instanceof ApiError ? error.message : 'Could not update your profile' });
      return false;
    }
  },

  updateAvatar: async (avatar) => {
    const user = get().user;
    if (!user?.isGuest) return false;
    const profile: GuestProfile = {
      displayName: user.displayName,
      avatar,
      createdAt: user.createdAt,
    };
    await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
    set({ user: { ...user, avatar } });
    return true;
  },

  clearError: () => set({ error: null }),
}));
