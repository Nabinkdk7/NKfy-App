import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { Button, IconButton } from '@/components/Button';
import { EmptyState } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import { formatLongDuration, formatTime } from '@/utils/format';

export default function QueueScreen() {
  const queue = usePlayerStore((state) => state.queue);
  const order = usePlayerStore((state) => state.order);
  const cursor = usePlayerStore((state) => state.cursor);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const toggle = usePlayerStore((state) => state.toggle);
  const jumpTo = usePlayerStore((state) => state.jumpTo);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const contextLabel = usePlayerStore((state) => state.contextLabel);

  const current = order[cursor] !== undefined ? queue[order[cursor]!] : null;
  const upNext = order
    .slice(cursor + 1)
    .map((queueIndex, offset) => ({ queueIndex, orderPosition: cursor + 1 + offset }))
    .filter((item) => queue[item.queueIndex]);

  const remaining = upNext.reduce(
    (sum, item) => sum + (queue[item.queueIndex]?.duration ?? 0),
    0
  );

  return (
    <Screen>
      <Header
        title="Queue"
        subtitle={contextLabel ? `Playing from ${contextLabel}` : 'Your playback queue'}
        onBack={() => router.back()}
        backIcon="chevron-down"
        right={
          queue.length > 0 ? (
            <Pressable
              onPress={() => {
                clearQueue();
                toast('Queue cleared');
                router.back();
              }}
              hitSlop={8}
            >
              <Text style={styles.clear}>Clear</Text>
            </Pressable>
          ) : null
        }
      />

      {!current ? (
        <EmptyState
          icon="queue"
          title="The queue is empty"
          message="Play a playlist or an album and the songs will line up here."
          action={<Button label="Browse music" icon="play" onPress={() => router.back()} />}
        />
      ) : (
        <>
          <Text style={styles.sectionLabel}>Now playing</Text>
          <Pressable
            onPress={() => router.push('/player')}
            style={({ pressed }) => [styles.current, pressed && styles.pressed]}
          >
            <Artwork source={current.artwork} size={58} radius={12} label={current.title} />
            <View style={styles.currentCopy}>
              <Text style={styles.currentTitle} numberOfLines={1}>
                {current.title}
              </Text>
              <Text style={styles.currentArtist} numberOfLines={1}>
                {current.artist}
              </Text>
              <View style={styles.currentMeta}>
                <View style={styles.liveDot} />
                <Text style={styles.currentState}>{isPlaying ? 'Playing now' : 'Paused'}</Text>
              </View>
            </View>
            <IconButton
              icon={isPlaying ? 'pause' : 'play'}
              size={44}
              iconSize={18}
              background={colors.accent}
              color={colors.white}
              onPress={toggle}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            />
          </Pressable>

          <View style={styles.nextHeader}>
            <Text style={styles.sectionLabel}>Next up</Text>
            <Text style={styles.nextMeta}>
              {upNext.length} {upNext.length === 1 ? 'song' : 'songs'} · {formatLongDuration(remaining)}
            </Text>
          </View>

          {upNext.length === 0 ? (
            <View style={styles.endCard}>
              <Icon name="check" size={18} color={colors.accentLight} />
              <Text style={styles.endText}>That is the end of the queue.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {upNext.map(({ queueIndex, orderPosition }) => {
                const track = queue[queueIndex]!;
                return (
                  <Pressable
                    key={`${track.id}-${orderPosition}`}
                    onPress={() => jumpTo(orderPosition)}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  >
                    <Text style={styles.index}>{orderPosition - cursor}</Text>
                    <Artwork source={track.artwork} size={44} radius={9} label={track.title} />
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text style={styles.rowArtist} numberOfLines={1}>
                        {track.artist}
                      </Text>
                    </View>
                    <Text style={styles.duration}>{formatTime(track.duration)}</Text>
                    <IconButton
                      icon="close"
                      size={28}
                      iconSize={14}
                      color={colors.textMuted}
                      onPress={() => removeFromQueue(queueIndex)}
                      accessibilityLabel={`Remove ${track.title} from queue`}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.footer}>
            <Icon name="shuffle" size={14} color={colors.textMuted} />
            <Text style={styles.footerText}>
              Queue order is set when you start playback. Turn on shuffle in the player to reorder
              automatically.
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  clear: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.accentLight,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
  },
  currentCopy: {
    flex: 1,
    gap: 2,
  },
  currentTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.2,
  },
  currentArtist: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  currentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  currentState: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.accentLight,
  },
  nextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextMeta: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  list: {
    gap: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.sm - 1,
  },
  index: {
    width: 16,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.text,
  },
  rowArtist: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  duration: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  endCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  endText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xs,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textMuted,
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
