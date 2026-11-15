import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { Button, IconButton } from '@/components/Button';
import { GridCard, SegmentedControl, useGridWidth } from '@/components/Cards';
import { EmptyState, SectionHeader } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Sheet, SheetRow } from '@/components/Sheet';
import { demoCurated } from '@/data/demoCatalog';
import { usePlayCollection } from '@/hooks/usePlayback';
import { useLibraryStore } from '@/stores/libraryStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { Playlist } from '@/types/music';

type Segment = 'playlists' | 'mixes';

export default function PlaylistsScreen() {
  const playlists = useLibraryStore((state) => state.playlists);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);
  const updatePlaylist = useLibraryStore((state) => state.updatePlaylist);
  const deletePlaylist = useLibraryStore((state) => state.deletePlaylist);
  const playCollection = usePlayCollection();
  const cardWidth = useGridWidth(2, 12);

  const [segment, setSegment] = useState<Segment>('playlists');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [menu, setMenu] = useState<Playlist | null>(null);
  const [renaming, setRenaming] = useState<Playlist | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const closeEditor = () => {
    setCreating(false);
    setName('');
    setDescription('');
  };

  const handleCreate = () => {
    const playlist = createPlaylist(name, description);
    closeEditor();
    toast(`Created “${playlist.name}”`, 'success');
    router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } });
  };

  const handleRename = () => {
    if (!renaming) return;
    updatePlaylist(renaming.id, { name: renameValue });
    toast('Playlist renamed');
    setRenaming(null);
    setRenameValue('');
  };

  const handleDelete = (playlist: Playlist) => {
    setMenu(null);
    Alert.alert(
      'Delete playlist?',
      `“${playlist.name}” will be removed from your library. The songs stay untouched.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlaylist(playlist.id);
            toast('Playlist deleted');
          },
        },
      ]
    );
  };

  return (
    <Screen reserveMiniPlayer>
      <Header
        title="Playlists"
        large
        eyebrow={`${playlists.length} collections · ${playlists.reduce(
          (sum, playlist) => sum + playlist.tracks.length,
          0
        )} songs`}
        right={
          <IconButton
            icon="plus"
            size={38}
            iconSize={20}
            background={colors.accentSoft}
            color={colors.accentLight}
            onPress={() => setCreating(true)}
            accessibilityLabel="Create playlist"
          />
        }
      />

      <Pressable
        onPress={() => setCreating(true)}
        style={({ pressed }) => [styles.createCard, pressed && styles.pressed]}
      >
        <View style={styles.createIcon}>
          <Icon name="plus" size={22} color={colors.accentLight} />
        </View>
        <View style={styles.createCopy}>
          <Text style={styles.createTitle}>Create a playlist</Text>
          <Text style={styles.createText}>Collect the songs that move you.</Text>
        </View>
        <Icon name="chevron-right" size={16} color={colors.textMuted} />
      </Pressable>

      <View style={styles.segmented}>
        <SegmentedControl<Segment>
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'playlists', label: 'My playlists' },
            { value: 'mixes', label: 'NKfy mixes' },
          ]}
        />
      </View>

      {segment === 'playlists' ? (
        <>
          <SectionHeader
            title="Your collection"
            actionLabel="New"
            onAction={() => setCreating(true)}
            style={styles.section}
          />
          {playlists.length === 0 ? (
            <EmptyState
              icon="playlist"
              title="No playlists yet"
              message="Create your first playlist and start collecting songs you love."
              action={<Button label="Create playlist" icon="plus" onPress={() => setCreating(true)} />}
            />
          ) : (
            <View style={styles.grid}>
              {playlists.map((playlist) => (
                <GridCard
                  key={playlist.id}
                  title={playlist.name}
                  subtitle={`${playlist.tracks.length} ${playlist.tracks.length === 1 ? 'song' : 'songs'}`}
                  artwork={playlist.coverUri ?? playlist.tracks[0]?.artwork}
                  width={cardWidth}
                  onPress={() =>
                    router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } })
                  }
                  onMore={() => setMenu(playlist)}
                />
              ))}
            </View>
          )}

          <Pressable
            onPress={() => router.push('/favorites')}
            style={({ pressed }) => [styles.liked, pressed && styles.pressed]}
          >
            <View style={styles.likedIcon}>
              <Icon name="heart" size={18} color={colors.white} filled />
            </View>
            <View style={styles.createCopy}>
              <Text style={styles.createTitle}>Liked Songs</Text>
              <Text style={styles.createText}>Everything you have hearted</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textMuted} />
          </Pressable>
        </>
      ) : (
        <>
          <SectionHeader
            title="Curated by NKfy"
            actionLabel="Explore"
            onAction={() => router.push('/discover')}
            style={styles.section}
          />
          <View style={styles.mixList}>
            {demoCurated.map((mix) => (
              <Pressable
                key={mix.id}
                onPress={() =>
                  router.push({ pathname: '/curated/[id]', params: { id: mix.id } })
                }
                style={({ pressed }) => [styles.mixRow, pressed && styles.pressed]}
              >
                <Artwork
                  source={mix.cover}
                  size={62}
                  radius={12}
                  label={mix.name}
                />
                <View style={styles.mixCopy}>
                  <Text style={styles.mixTitle} numberOfLines={1}>
                    {mix.name}
                  </Text>
                  <Text style={styles.mixText} numberOfLines={1}>
                    {mix.description}
                  </Text>
                  <Text style={styles.mixCount}>
                    {mix.tracks?.length ?? 0} bundled tracks
                  </Text>
                </View>
                {mix.tracks && mix.tracks.length > 0 ? (
                  <IconButton
                    icon="play"
                    size={34}
                    iconSize={14}
                    background={colors.accent}
                    color={colors.white}
                    onPress={() => playCollection(mix.tracks ?? [], mix.name)}
                    accessibilityLabel={`Play ${mix.name}`}
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Sheet
        visible={creating}
        onClose={closeEditor}
        title="New playlist"
        subtitle="Give it a name and a little character"
        scroll={false}
      >
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Late night drive"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            selectionColor={colors.accent}
            maxLength={80}
          />
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.multiline]}
            multiline
            selectionColor={colors.accent}
            maxLength={300}
          />
          <Button label="Create playlist" icon="plus" onPress={handleCreate} fullWidth />
        </View>
      </Sheet>

      <Sheet
        visible={Boolean(menu)}
        onClose={() => setMenu(null)}
        title={menu?.name}
        subtitle={`${menu?.tracks.length ?? 0} songs`}
      >
        {menu ? (
          <View>
            <SheetRow
              label="Play playlist"
              icon={<Icon name="play" size={16} color={colors.text} />}
              onPress={() => {
                playCollection(menu.tracks, menu.name);
                setMenu(null);
              }}
            />
            <SheetRow
              label="Shuffle play"
              icon={<Icon name="shuffle" size={16} color={colors.text} />}
              onPress={() => {
                playCollection(menu.tracks, menu.name, { shuffle: true });
                setMenu(null);
              }}
            />
            <SheetRow
              label="Rename playlist"
              icon={<Icon name="edit" size={16} color={colors.text} />}
              onPress={() => {
                setRenaming(menu);
                setRenameValue(menu.name);
                setMenu(null);
              }}
            />
            <SheetRow
              label="Delete playlist"
              icon={<Icon name="trash" size={16} color={colors.danger} />}
              onPress={() => handleDelete(menu)}
              danger
            />
          </View>
        ) : null}
      </Sheet>

      <Sheet
        visible={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        title="Rename playlist"
        scroll={false}
      >
        <View style={styles.form}>
          <TextInput
            value={renameValue}
            onChangeText={setRenameValue}
            placeholder="Playlist name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            selectionColor={colors.accent}
            maxLength={80}
          />
          <Button label="Save changes" onPress={handleRename} fullWidth />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.accentFaint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
  },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCopy: {
    flex: 1,
    gap: 2,
  },
  createTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  createText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  segmented: {
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  liked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  likedIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixList: {
    gap: spacing.xs,
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  mixCopy: {
    flex: 1,
    gap: 2,
  },
  mixTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.text,
  },
  mixText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  mixCount: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  form: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: spacing.xs,
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
    height: 84,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  pressed: {
    opacity: 0.72,
  },
});
