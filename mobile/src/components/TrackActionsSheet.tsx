import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Sheet, SheetRow } from '@/components/Sheet';
import { colors, fonts, radii, spacing } from '@/theme';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import type { Track } from '@/types/music';
import { albumKey, artistKey } from '@/utils/catalog';

interface TrackActionsSheetProps {
  track: Track | null;
  visible: boolean;
  onClose: () => void;
  playlistId?: string;
  playlistName?: string;
}

export function TrackActionsSheet({
  track,
  visible,
  onClose,
  playlistId,
  playlistName,
}: TrackActionsSheetProps) {
  const [mode, setMode] = useState<'root' | 'playlists'>('root');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const playlists = useLibraryStore((state) => state.playlists);
  const favorites = useLibraryStore((state) => state.favorites);

  useEffect(() => {
    if (visible) {
      setMode('root');
      setCreating(false);
      setNewName('');
    }
  }, [visible]);

  if (!track) return null;

  const favorite = favorites.some((item) => item.id === track.id);
  const canOpenExternal = Boolean(track.externalUrl);

  const close = () => onClose();

  const handleFavorite = () => {
    const added = useLibraryStore.getState().toggleFavorite(track);
    toast(added ? 'Added to your favorites' : 'Removed from favorites');
    close();
  };

  const handlePlayNext = () => {
    usePlayerStore.getState().playNext(track);
    toast('Playing next');
    close();
  };

  const handleEnqueue = () => {
    usePlayerStore.getState().enqueue(track);
    toast('Added to the queue');
    close();
  };

  const handleGoToArtist = () => {
    close();
    router.push({ pathname: '/artist/[id]', params: { id: artistKey(track.artist) } });
  };

  const handleGoToAlbum = () => {
    if (!track.album) {
      toast('This track has no album information');
      return;
    }
    close();
    router.push({ pathname: '/album/[id]', params: { id: albumKey(track) } });
  };

  const handleExternal = async () => {
    if (!track.externalUrl) return;
    try {
      await Linking.openURL(track.externalUrl);
      close();
    } catch {
      toast('Could not open the link', 'error');
    }
  };

  const handleRemoveFromPlaylist = () => {
    if (!playlistId) return;
    useLibraryStore.getState().removeTrackFromPlaylist(playlistId, track.id);
    toast('Removed from playlist');
    close();
  };

  const handleCreateAndAdd = () => {
    const name = newName.trim() || 'New Playlist';
    useLibraryStore.getState().createPlaylist(name, undefined, [track]);
    toast(`Created “${name}”`);
    close();
  };

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={mode === 'playlists' ? 'Add to playlist' : undefined}
      subtitle={mode === 'playlists' ? 'Choose where this song should go' : undefined}
    >
      {mode === 'root' ? (
        <>
          <View style={styles.trackHeader}>
            <Artwork source={track.artwork} size={54} radius={12} label={track.title} />
            <View style={styles.trackCopy}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {track.artist}
                {track.album ? ` · ${track.album}` : ''}
              </Text>
            </View>
            <IconButton
              icon="close"
              size={32}
              iconSize={18}
              color={colors.textMuted}
              onPress={close}
            />
          </View>

          <View style={styles.rows}>
            {track.isPlayable ? (
              <>
                <SheetRow
                  label="Play next"
                  icon={<Icon name="list" size={17} color={colors.text} />}
                  onPress={handlePlayNext}
                />
                <SheetRow
                  label="Add to queue"
                  icon={<Icon name="queue" size={17} color={colors.text} />}
                  onPress={handleEnqueue}
                />
              </>
            ) : null}
            <SheetRow
              label="Add to playlist"
              icon={<Icon name="plus" size={17} color={colors.text} />}
              onPress={() => setMode('playlists')}
              trailing={<Icon name="chevron-right" size={16} color={colors.textMuted} />}
            />
            <SheetRow
              label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              icon={
                <Icon
                  name="heart"
                  size={17}
                  color={favorite ? colors.accentLight : colors.text}
                  filled={favorite}
                />
              }
              onPress={handleFavorite}
            />
            <SheetRow
              label="Go to artist"
              icon={<Icon name="profile" size={17} color={colors.text} />}
              onPress={handleGoToArtist}
            />
            {track.album ? (
              <SheetRow
                label="View album"
                icon={<Icon name="disc" size={17} color={colors.text} />}
                onPress={handleGoToAlbum}
              />
            ) : null}
            {canOpenExternal ? (
              <SheetRow
                label={track.source === 'youtube' ? 'Open in YouTube' : 'Open source page'}
                description={track.source === 'youtube' ? 'Playback continues in the official app' : undefined}
                icon={<Icon name="external" size={17} color={colors.text} />}
                onPress={handleExternal}
              />
            ) : null}
            {playlistId ? (
              <SheetRow
                label="Remove from this playlist"
                description={playlistName}
                icon={<Icon name="trash" size={17} color={colors.danger} />}
                onPress={handleRemoveFromPlaylist}
                danger
              />
            ) : null}
          </View>
        </>
      ) : (
        <>
          <View style={styles.rows}>
            {!creating ? (
              <SheetRow
                label="Create new playlist"
                icon={<Icon name="plus" size={17} color={colors.accentLight} />}
                onPress={() => setCreating(true)}
              />
            ) : (
              <View style={styles.createRow}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Playlist name"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoFocus
                  selectionColor={colors.accent}
                />
                <Button label="Create" size="sm" onPress={handleCreateAndAdd} />
              </View>
            )}

            {playlists.map((playlist) => (
              <Pressable
                key={playlist.id}
                onPress={() => {
                  const added = useLibraryStore
                    .getState()
                    .addTracksToPlaylist(playlist.id, [track]);
                  toast(
                    added
                      ? `Added to “${playlist.name}”`
                      : `“${playlist.name}” already has this song`
                  );
                  close();
                }}
                style={({ pressed }) => [styles.playlistRow, pressed && styles.pressed]}
              >
                <Artwork
                  source={playlist.coverUri ?? track.artwork}
                  size={44}
                  radius={10}
                  label={playlist.name}
                />
                <View style={styles.playlistCopy}>
                  <Text style={styles.playlistName} numberOfLines={1}>
                    {playlist.name}
                  </Text>
                  <Text style={styles.playlistCount}>
                    {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
                  </Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setMode('root')} style={styles.backLink}>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  trackCopy: {
    flex: 1,
    gap: 3,
  },
  trackTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.2,
  },
  trackArtist: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  rows: {
    gap: 1,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 9,
  },
  pressed: {
    opacity: 0.65,
  },
  playlistCopy: {
    flex: 1,
    gap: 2,
  },
  playlistName: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  playlistCount: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.md,
  },
  backLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.accentLight,
  },
});
