import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ApiError, api } from '@/api/client';
import { pullLibrary, pushLibrary } from '@/api/sync';
import { Button, IconButton } from '@/components/Button';
import { SegmentedControl, SettingRow, SettingSection } from '@/components/Cards';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { requestLocalMusicAccess, scanLocalMusic, localMusicAvailable } from '@/native/localMusic';
import { useAuthStore } from '@/stores/authStore';
import { eqPresets, useEqualizerStore } from '@/stores/equalizerStore';
import { useLibraryStore, type AppSettings } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import { initials } from '@/utils/format';

type Quality = AppSettings['audioQuality'];

function tap() {
  void Haptics.selectionAsync().catch(() => undefined);
}

function formatSyncTime(value: number | null): string {
  if (!value) return 'Not synced yet';
  return `Last sync ${new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const signOut = useAuthStore((state) => state.signOut);
  const signedIn = status === 'signedIn' && Boolean(user) && Boolean(token);

  const settings = useLibraryStore((state) => state.settings);
  const updateSettings = useLibraryStore((state) => state.updateSettings);
  const localTracks = useLibraryStore((state) => state.localTracks);
  const favorites = useLibraryStore((state) => state.favorites);
  const playlists = useLibraryStore((state) => state.playlists);
  const scanStatus = useLibraryStore((state) => state.scanStatus);
  const lastScannedAt = useLibraryStore((state) => state.lastScannedAt);
  const setLocalTracks = useLibraryStore((state) => state.setLocalTracks);
  const setScanState = useLibraryStore((state) => state.setScanState);
  const recentSearches = useLibraryStore((state) => state.recentSearches);
  const clearRecentSearches = useLibraryStore((state) => state.clearRecentSearches);
  const recents = usePlayerStore((state) => state.recents);
  const queueLength = usePlayerStore((state) => state.queue.length);
  const forgetRecents = usePlayerStore((state) => state.forgetRecents);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const eqEnabled = useEqualizerStore((state) => state.enabled);
  const eqPresetId = useEqualizerStore((state) => state.presetId);
  const [creditHovered, setCreditHovered] = useState(false);

  const [syncing, setSyncing] = useState<'push' | 'pull' | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'latest' | 'error'>('idle');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    try {
      const result = await api.version();
      setLatestVersion(result.version);
      setDownloadUrl(result.downloadUrl);
      const current = Constants.expoConfig?.version ?? '1.0.0';
      if (result.version && result.version !== current) {
        setUpdateStatus('available');
        toast(`Update available: ${result.version}`, 'success');
      } else {
        setUpdateStatus('latest');
        toast('You are on the latest version', 'success');
      }
    } catch {
      setUpdateStatus('error');
      toast('Could not check for updates', 'error');
    }
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const eqPresetName = eqPresets.find((preset) => preset.id === eqPresetId)?.name ?? 'Custom';

  function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    tap();
    updateSettings({ [key]: value } as Partial<AppSettings>);
  }

  const scan = async () => {
    if (scanStatus === 'scanning') return;
    if (!localMusicAvailable()) {
      setScanState(
        'unavailable',
        'Device music needs the native Android or iOS build. Expo Go cannot read your library.'
      );
      toast('Device music needs a development build', 'error');
      return;
    }
    setScanState('scanning');
    const access = await requestLocalMusicAccess();
    if (access !== 'granted') {
      setScanState(
        access === 'unavailable' ? 'unavailable' : 'denied',
        access === 'restricted'
          ? 'Music access is restricted on this device.'
          : 'Music access was not granted. You can enable it in system settings.'
      );
      toast('Music permission is needed to scan', 'error');
      return;
    }
    try {
      const found = await scanLocalMusic();
      setLocalTracks(found);
      toast(
        found.length > 0 ? `Found ${found.length} songs on this device` : 'No songs found on this device',
        found.length > 0 ? 'success' : 'default'
      );
    } catch (error) {
      setScanState(
        'unavailable',
        error instanceof Error ? error.message : 'The device library could not be read.'
      );
      toast('Could not read device music', 'error');
    }
  };

  const runSync = async (direction: 'push' | 'pull') => {
    if (!token) {
      router.push('/auth');
      return;
    }
    setSyncing(direction);
    try {
      const result = direction === 'push' ? await pushLibrary(token) : await pullLibrary(token);
      setLastSyncAt(Date.now());
      toast(
        direction === 'push'
          ? `Backed up ${result.favorites} favorites and ${result.playlists} playlists`
          : `Restored ${result.favorites} favorites and ${result.playlists} playlists`,
        'success'
      );
    } catch (error) {
      toast(
        error instanceof ApiError ? error.message : 'Sync failed. Check your connection.',
        'error'
      );
    } finally {
      setSyncing(null);
    }
  };

  const confirmRestore = () => {
    if (!token) {
      router.push('/auth');
      return;
    }
    Alert.alert(
      'Restore from cloud?',
      'Your cloud favorites replace the favorites on this device. Cloud playlists are merged into your local list, and local-only playlists stay untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => void runSync('pull') },
      ]
    );
  };

  const confirmClearQueue = () => {
    Alert.alert('Clear the queue?', 'Playback will stop and the current queue will be emptied.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearQueue();
          toast('Queue cleared');
        },
      },
    ]);
  };

  const confirmForgetRecents = () => {
    Alert.alert('Clear recently played?', 'This only clears the history on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          forgetRecents();
          toast('Recently played cleared');
        },
      },
    ]);
  };

  const confirmSignOut = () => {
    const proceed = () => {
      void signOut();
      setLastSyncAt(null);
      toast('Signed out');
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm('Sign out? Your on-device library and playlists stay on this device.')) {
        proceed();
      }
    } else {
      Alert.alert('Sign out?', 'Your on-device library and playlists stay on this device.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: proceed },
      ]);
    }
  };

  return (
    <Screen showMiniPlayer>
      <Header
        title="Settings"
        onBack={() => router.back()}
        right={
          <IconButton
            icon="check"
            size={38}
            iconSize={20}
            color={colors.accentLight}
            onPress={() => router.back()}
            accessibilityLabel="Done"
          />
        }
      />

      <View style={styles.accountCard}>
        <View style={styles.avatar}>
          {user ? (
            <Text style={styles.avatarText}>
              {user.isGuest ? (user.avatar ?? '🎵') : initials(user.displayName)}
            </Text>
          ) : (
            <Icon name="profile" size={24} color={colors.accentLight} />
          )}
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountName}>{user?.displayName ?? 'Guest listener'}</Text>
          <Text style={styles.accountMeta}>
            {user?.isGuest
              ? 'Guest on this device'
              : (user?.email ?? 'Sign in to sync favorites and playlists')}
          </Text>
        </View>
        <Button
          label={signedIn ? 'Account' : 'Sign in'}
          size="sm"
          variant={signedIn ? 'secondary' : 'primary'}
          onPress={() => router.push('/auth')}
        />
      </View>

      {signedIn ? (
        <View style={styles.syncCard}>
          <View style={styles.syncHeader}>
            <View style={styles.syncIcon}>
              <Icon name="shield" size={18} color={colors.accentLight} />
            </View>
            <View style={styles.syncCopy}>
              <Text style={styles.syncTitle}>Cloud backup</Text>
              <Text style={styles.syncText}>
                {favorites.length} favorites · {playlists.length} playlists · {formatSyncTime(lastSyncAt)}
              </Text>
            </View>
          </View>
          <View style={styles.syncActions}>
            <Button
              label="Back up now"
              icon="arrow-right"
              size="sm"
              variant="soft"
              onPress={() => void runSync('push')}
              loading={syncing === 'push'}
              disabled={Boolean(syncing)}
              style={styles.syncButton}
            />
            <Button
              label="Restore"
              icon="refresh"
              size="sm"
              variant="secondary"
              onPress={confirmRestore}
              loading={syncing === 'pull'}
              disabled={Boolean(syncing)}
              style={styles.syncButton}
            />
          </View>
        </View>
      ) : null}

      <SettingSection title="Playback">
        <SettingRow
          icon="volume"
          label="Audio quality"
          description="Applies to online streams"
          right={
            <View style={styles.qualityWrap}>
              <SegmentedControl<Quality>
                value={settings.audioQuality}
                onChange={(value) => setSetting('audioQuality', value)}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'high', label: 'High' },
                  { value: 'saver', label: 'Saver' },
                ]}
              />
            </View>
          }
        />
        <SettingRow
          icon="play"
          label="Autoplay"
          description="Keep the music going after a queue ends"
          right={
            <Switch
              value={settings.autoplay}
              onValueChange={(value) => setSetting('autoplay', value)}
              trackColor={{ false: colors.surfaceHigh, true: 'rgba(47,128,255,0.55)' }}
              thumbColor={settings.autoplay ? colors.accent : '#8A93A2'}
              ios_backgroundColor={colors.surfaceHigh}
            />
          }
        />
        <SettingRow
          icon="sliders"
          label="Crossfade"
          description="Blend the end of one track into the next"
          right={
            <View style={styles.crossfadeWrap}>
              <SegmentedControl<string>
                value={String(settings.crossfade)}
                onChange={(value) => setSetting('crossfade', Number(value))}
                options={[
                  { value: '0', label: 'Off' },
                  { value: '2', label: '2s' },
                  { value: '4', label: '4s' },
                  { value: '8', label: '8s' },
                ]}
              />
            </View>
          }
        />
        <SettingRow
          icon="waveform"
          label="Equalizer"
          description={eqEnabled ? `${eqPresetName} · enabled` : 'Flat · disabled'}
          value="Open"
          onPress={() => router.push('/equalizer')}
          last
        />
      </SettingSection>

      <SettingSection title="Device music">
        <SettingRow
          icon="smartphone"
          label="Scan this device"
          description={
            scanStatus === 'scanning'
              ? 'Reading your music library…'
              : `${localTracks.length} songs · ${
                  lastScannedAt
                    ? `last scan ${new Date(lastScannedAt).toLocaleDateString()}`
                    : 'not scanned yet'
                }`
          }
          value={scanStatus === 'scanning' ? 'Working' : 'Scan'}
          onPress={scan}
        />
        <SettingRow
          icon="trash"
          label="Remove device songs"
          description="Clears the scanned list without touching your files"
          value={String(localTracks.length)}
          danger={localTracks.length > 0}
          onPress={() => {
            if (localTracks.length === 0) {
              toast('There are no scanned songs to remove');
              return;
            }
            Alert.alert('Remove device songs?', 'Your music files stay on the device.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  setLocalTracks([]);
                  toast('Scanned songs removed');
                },
              },
            ]);
          }}
          last
        />
      </SettingSection>

      <SettingSection title="Experience">
        <SettingRow
          icon="bell"
          label="Notifications"
          description="Lock-screen and playback notifications"
          right={
            <Switch
              value={settings.notifications}
              onValueChange={(value) => setSetting('notifications', value)}
              trackColor={{ false: colors.surfaceHigh, true: 'rgba(47,128,255,0.55)' }}
              thumbColor={settings.notifications ? colors.accent : '#8A93A2'}
              ios_backgroundColor={colors.surfaceHigh}
            />
          }
        />
        <SettingRow
          icon="sparkles"
          label="Animations"
          description="Subtle transitions and motion"
          right={
            <Switch
              value={settings.animations}
              onValueChange={(value) => setSetting('animations', value)}
              trackColor={{ false: colors.surfaceHigh, true: 'rgba(47,128,255,0.55)' }}
              thumbColor={settings.animations ? colors.accent : '#8A93A2'}
              ios_backgroundColor={colors.surfaceHigh}
            />
          }
        />
        <SettingRow
          icon="download"
          label="Scan at launch"
          description="Check for new device music when the app opens"
          right={
            <Switch
              value={settings.scanOnLaunch}
              onValueChange={(value) => setSetting('scanOnLaunch', value)}
              trackColor={{ false: colors.surfaceHigh, true: 'rgba(47,128,255,0.55)' }}
              thumbColor={settings.scanOnLaunch ? colors.accent : '#8A93A2'}
              ios_backgroundColor={colors.surfaceHigh}
            />
          }
          last
        />
      </SettingSection>

      <SettingSection title="Storage">
        <SettingRow
          icon="search"
          label="Recent searches"
          description="Suggestions shown in search"
          value={String(recentSearches.length)}
          onPress={() => {
            if (recentSearches.length === 0) {
              toast('No recent searches to clear');
              return;
            }
            clearRecentSearches();
            toast('Recent searches cleared');
          }}
        />
        <SettingRow
          icon="queue"
          label="Playback queue"
          description="Songs waiting to play"
          value={String(queueLength)}
          onPress={confirmClearQueue}
        />
        <SettingRow
          icon="clock"
          label="Recently played"
          description="History used for quick jumps"
          value={String(recents.length)}
          onPress={confirmForgetRecents}
          last
        />
      </SettingSection>

      <SettingSection title="About">
        <SettingRow icon="logo" label="NKfy" description="Feel The Music" value={`v${version}`} />
                <SettingRow
          icon="download"
          label="Check for updates"
          description={
            updateStatus === 'checking'
              ? 'Checking...'
              : updateStatus === 'available'
              ? `Update ${latestVersion} available`
              : updateStatus === 'latest'
              ? 'You are up to date'
              : updateStatus === 'error'
              ? 'Check failed'
              : 'Tap to check the server for a new release'
          }
          onPress={checkForUpdates}
        />

        {updateStatus === 'available' && downloadUrl ? (
          <SettingRow
            icon="download"
            label="Download update"
            description={downloadUrl}
            onPress={() => {
              void Linking.openURL(downloadUrl).catch(() => toast('Could not open the download link', 'error'));
            }}
            last
          />
        ) : (
          <SettingRow
            icon="globe"
            label="Music sources"
            description="Audius, Jamendo and official YouTube playback. Nothing is downloaded or extracted."
          />
        )}
        <SettingRow
          icon="shield"
          label="Privacy"
          description="Your library lives on this device. Only favorites and playlists sync when you ask."
        />
        <SettingRow
          icon="mail"
          label="Support"
          description="Questions, feedback or a bug to report"
          value="WhatsApp"
          onPress={() => {
            const url = 'https://wa.me/9779742483084?text=' + encodeURIComponent('Hi NKfy, I need help with...');
            void Linking.openURL(url).catch(() => toast('Could not open WhatsApp', 'error'));
          }}
          last
        />
      </SettingSection>

      <View style={styles.creditWrap}>
        <Pressable
          onPress={() => {
            void Linking.openURL('https://nabinkhadka.com').catch(() =>
              toast('Could not open the link', 'error')
            );
          }}
          onHoverIn={() => setCreditHovered(true)}
          onHoverOut={() => setCreditHovered(false)}
          style={styles.creditPressable}
          accessibilityRole="link"
          accessibilityLabel="Developer Nabin Khadka"
        >
          <Text style={[styles.creditText, creditHovered && styles.creditTextHovered]}>
            Dev by Nabin Khadka
          </Text>
        </Pressable>
      </View>

      {signedIn ? (
        <Button
          label="Sign out"
          icon="logout"
          variant="danger"
          onPress={confirmSignOut}
          style={styles.signOut}
        />
      ) : (
        <Button
          label="Create an account"
          icon="profile"
          variant="secondary"
          onPress={() => router.push('/auth')}
          style={styles.signOut}
        />
      )}

      <Text style={styles.footer}>
        NKfy · Feel The Music · v{version}
        {'\n'}Built for your own library and the open music web.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.accentLight,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.text,
  },
  accountMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  syncCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.accentFaint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.26)',
    gap: spacing.md,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  syncIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncCopy: {
    flex: 1,
    gap: 2,
  },
  syncTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.text,
  },
  syncText: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  syncActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  syncButton: {
    flex: 1,
  },
  qualityWrap: {
    width: 156,
  },
  crossfadeWrap: {
    width: 176,
  },
  signOut: {
    marginTop: spacing.xxl,
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  creditWrap: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  creditPressable: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    outlineWidth: 0,
  },
  creditText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  creditTextHovered: {
    color: colors.accentLight,
    textDecorationLine: 'underline',
  },
});
