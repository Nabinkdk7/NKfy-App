import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Artwork } from '@/components/Artwork';
import { Button, IconButton } from '@/components/Button';
import { EmptyState } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Sheet, SheetRow } from '@/components/Sheet';
import { SongRow } from '@/components/SongRow';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { demoTracks } from '@/data/demoCatalog';
import { usePlayCollection } from '@/hooks/usePlayback';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { Playlist, Track } from '@/types/music';
import { uniqueBy } from '@/utils/array';
import { formatLongDuration } from '@/utils/format';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlistId = Array.isArray(id) ? id[0] : id;
  const playlist = useLibraryStore((state) =>
    state.playlists.find((item) => item.id === playlistId)
  );
  const localTracks = useLibraryStore((state) => state.localTracks);
  const favorites = useLibraryStore((state) => state.favorites);
  const addTracks = useLibraryStore((state) => state.addTracksToPlaylist);
  const updatePlaylist = useLibraryStore((state) => state.updatePlaylist);
  const deletePlaylist = useLibraryStore((state) => state.deletePlaylist);
  const playCollection = usePlayCollection();

  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const toggle = usePlayerStore((state) => state.toggle);

  const [menuOpen, setMenuOpen] = useState(false);
  const [addingSongs, setAddingSongs] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [actionTrack, setActionTrack] = useState<Track | null>(null);

  const candidates = useMemo(
    () =>
      uniqueBy([...localTracks, ...favorites, ...demoTracks], (track) => track.id).filter(
        (track) => !playlist?.tracks.some((item) => item.id === track.id)
      ),
    [favorites, localTracks, playlist?.tracks]
  );

  if (!playlist) {
    return (
      <Screen>
        <Header title="Playlist" onBack={() => router.back()} />
        <EmptyState
          icon="playlist"
          title="Playlist not found"
          message="It may have been deleted from this device."
          action={<Button label="Back to playlists" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const collectionPlaying =
    Boolean(currentTrack) && playlist.tracks.some((track) => track.id === currentTrack!.id);
  const total = playlist.tracks.reduce((sum, track) => sum + track.duration, 0);

  const confirmDelete = () => {
    setMenuOpen(false);
    Alert.alert('Delete playlist?', `“${playlist.name}” will be removed from your library.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlaylist(playlist.id);
          toast('Playlist deleted');
          router.back();
        },
      },
    ]);
  };

  const openRename = () => {
    setName(playlist.name);
    setDescription(playlist.description ?? '');
    setMenuOpen(false);
    setRenaming(true);
  };

  const saveRename = () => {
    updatePlaylist(playlist.id, { name, description });
    setRenaming(false);
    toast('Playlist updated');
  };

  return (
    <Screen showMiniPlayer>
      <Header
        title="Playlist"
        onBack={() => router.back()}
        right={
          <IconButton
            icon="more"
            size={38}
            iconSize={20}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Playlist options"
          />
        }
      />

      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(47,128,255,0.2)', 'rgba(18,21,26,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <PlaylistCover playlist={playlist} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>PLAYLIST</Text>
          <Text style={styles.title} numberOfLines={2}>
            {playlist.name}
          </Text>
          {playlist.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {playlist.description}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {playlist.tracks.length} songs
            {playlist.tracks.length > 0 ? ` · ${formatLongDuration(total)}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <IconButton
          icon={collectionPlaying && isPlaying ? 'pause' : 'play'}
          size={52}
          iconSize={22}
          background={colors.accent}
          color={colors.white}
          onPress={() => {
            if (collectionPlaying) toggle();
            else playCollection(playlist.tracks, playlist.name);
          }}
          accessibilityLabel={collectionPlaying && isPlaying ? 'Pause playlist' : 'Play playlist'}
        />
        <Button
          label="Shuffle"
          icon="shuffle"
          size="sm"
          variant="secondary"
          onPress={() => playCollection(playlist.tracks, playlist.name, { shuffle: true })}
          disabled={playlist.tracks.length === 0}
        />
        <View style={styles.spacer} />
        <Button
          label="Add songs"
          icon="plus"
          size="sm"
          variant="soft"
          onPress={() => setAddingSongs(true)}
        />
      </View>

      {playlist.tracks.length === 0 ? (
        <EmptyState
          icon="music"
          title="This playlist is empty"
          message="Add songs from your device, your favorites or the NKfy sessions."
          action={<Button label="Add songs" icon="plus" onPress={() => setAddingSongs(true)} />}
        />
      ) : (
        <View style={styles.list}>
          {playlist.tracks.map((track, index) => (
            <SongRow
              key={track.id}
              track={track}
              index={index + 1}
              showArtwork={false}
              active={currentTrack?.id === track.id}
              onPress={() =>
                playCollection(playlist.tracks, playlist.name, { startTrackId: track.id })
              }
              onMore={() => setActionTrack(track)}
              showProvider
            />
          ))}
        </View>
      )}

      <Text style={styles.footer}>
        Created {new Date(playlist.createdAt).toLocaleDateString()} · {playlist.tracks.length}{' '}
        songs · {formatLongDuration(total)}
      </Text>

      <Sheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={playlist.name}
        subtitle={`${playlist.tracks.length} songs`}
      >
        <SheetRow
          label="Play playlist"
          icon={<Icon name="play" size={16} color={colors.text} />}
          onPress={() => {
            playCollection(playlist.tracks, playlist.name);
            setMenuOpen(false);
          }}
        />
        <SheetRow
          label="Shuffle play"
          icon={<Icon name="shuffle" size={16} color={colors.text} />}
          onPress={() => {
            playCollection(playlist.tracks, playlist.name, { shuffle: true });
            setMenuOpen(false);
          }}
        />
        <SheetRow
          label="Add songs"
          icon={<Icon name="plus" size={16} color={colors.text} />}
          onPress={() => {
            setMenuOpen(false);
            setAddingSongs(true);
          }}
        />
        <SheetRow
          label="Edit details"
          icon={<Icon name="edit" size={16} color={colors.text} />}
          onPress={openRename}
        />
        <SheetRow
          label="Delete playlist"
          icon={<Icon name="trash" size={16} color={colors.danger} />}
          onPress={confirmDelete}
          danger
        />
      </Sheet>

      <Sheet
        visible={addingSongs}
        onClose={() => setAddingSongs(false)}
        title="Add songs"
        subtitle={`${candidates.length} available · tap to add`}
      >
        {candidates.length === 0 ? (
          <Text style={styles.emptyCandidates}>
            Every song in your library is already in this playlist.
          </Text>
        ) : (
          candidates.map((track) => (
            <Pressable
              key={track.id}
              onPress={() => {
                const added = addTracks(playlist.id, [track]);
                toast(added ? `Added “${track.title}”` : 'Already in this playlist');
              }}
              style={({ pressed }) => [styles.candidate, pressed && styles.pressed]}
            >
              <Artwork source={track.artwork} size={42} radius={9} label={track.title} />
              <View style={styles.candidateCopy}>
                <Text style={styles.candidateTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={styles.candidateArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
              <View style={styles.addIcon}>
                <Icon name="plus" size={15} color={colors.accentLight} />
              </View>
            </Pressable>
          ))
        )}
      </Sheet>

      <Sheet
        visible={renaming}
        onClose={() => setRenaming(false)}
        title="Edit playlist"
        subtitle="Name and description"
        scroll={false}
      >
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Playlist name"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            maxLength={80}
          />
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.multiline]}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            multiline
            selectionColor={colors.accent}
            maxLength={300}
          />
          <Button label="Save changes" onPress={saveRename} fullWidth />
        </View>
      </Sheet>

      <TrackActionsSheet
        track={actionTrack}
        visible={Boolean(actionTrack)}
        onClose={() => setActionTrack(null)}
        playlistId={playlist.id}
        playlistName={playlist.name}
      />
    </Screen>
  );
}

function PlaylistCover({ playlist }: { playlist: Playlist }) {
  if (playlist.coverUri) {
    return <Artwork source={playlist.coverUri} size={142} radius={18} label={playlist.name} />;
  }
  const covers = playlist.tracks.slice(0, 4);
  if (covers.length >= 4) {
    return (
      <View style={styles.collage}>
        {covers.map((track) => (
          <Artwork
            key={track.id}
            source={track.artwork}
            size={70}
            radius={0}
            label={track.title}
          />
        ))}
      </View>
    );
  }
  return (
    <Artwork
      source={covers[0]?.artwork}
      size={142}
      radius={18}
      label={playlist.name}
    />
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.2)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 1.3,
    color: colors.accentLight,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.55,
    color: colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  collage: {
    width: 142,
    height: 142,
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  spacer: {
    flex: 1,
  },
  list: {
    marginTop: spacing.lg,
    gap: 1,
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  candidate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 7,
  },
  candidateCopy: {
    flex: 1,
    gap: 2,
  },
  candidateTitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.text,
  },
  candidateArtist: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCandidates: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    lineHeight: 18,
  },
  form: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  input: {
    height: 46,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.text,
  },
  multiline: {
    height: 80,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  pressed: {
    opacity: 0.68,
  },
});
