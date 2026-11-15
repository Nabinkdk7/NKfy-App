import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Chip, ChipRow } from '@/components/Chips';
import { SettingSection } from '@/components/Cards';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { VerticalSlider } from '@/components/SeekBar';
import { MAX_GAIN, eqLabels, eqPresets, useEqualizerStore } from '@/stores/equalizerStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import { clamp } from '@/utils/array';

function formatGain(value: number): string {
  if (Math.abs(value) < 0.05) return '0';
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

export default function EqualizerScreen() {
  const enabled = useEqualizerStore((state) => state.enabled);
  const presetId = useEqualizerStore((state) => state.presetId);
  const bands = useEqualizerStore((state) => state.bands);
  const bassBoost = useEqualizerStore((state) => state.bassBoost);
  const vocal = useEqualizerStore((state) => state.vocal);
  const treble = useEqualizerStore((state) => state.treble);
  const setEnabled = useEqualizerStore((state) => state.setEnabled);
  const setBand = useEqualizerStore((state) => state.setBand);
  const setBassBoost = useEqualizerStore((state) => state.setBassBoost);
  const setVocal = useEqualizerStore((state) => state.setVocal);
  const setTreble = useEqualizerStore((state) => state.setTreble);
  const applyPreset = useEqualizerStore((state) => state.applyPreset);
  const reset = useEqualizerStore((state) => state.reset);

  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });

  const activePreset = eqPresets.find((preset) => preset.id === presetId);
  const presetName = activePreset?.name ?? 'Custom';

  const handlePreset = (id: string) => {
    applyPreset(id);
    if (!enabled) {
      setEnabled(true);
      toast('Equalizer on · preset applied');
    }
  };

  const handleReset = () => {
    reset();
    toast('Equalizer reset to flat');
  };

  return (
    <Screen showMiniPlayer>
      <Header
        title="Equalizer"
        onBack={() => router.back()}
        right={
          <IconButton
            icon="refresh"
            size={38}
            iconSize={18}
            color={colors.textSecondary}
            onPress={handleReset}
            accessibilityLabel="Reset equalizer"
          />
        }
      />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="sliders" size={24} color={colors.accentLight} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>SOUND LAB</Text>
          <Text style={styles.heroTitle}>Shape your sound</Text>
          <Text style={styles.heroText}>
            {currentTrack
              ? `Tuning “${currentTrack.title}” · ${presetName}`
              : `Five bands, three enhancers · ${presetName}`}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: colors.surfaceHigh, true: 'rgba(47,128,255,0.55)' }}
          thumbColor={enabled ? colors.accent : '#8A93A2'}
          ios_backgroundColor={colors.surfaceHigh}
          accessibilityLabel="Enable equalizer"
        />
      </View>

      <View style={[styles.bandCard, !enabled && styles.dimmed]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>5-band equalizer</Text>
            <Text style={styles.cardHint}>
              {enabled ? 'Drag a band to fine-tune its gain' : 'Turn the equalizer on to hear changes'}
            </Text>
          </View>
          <View style={styles.gainPill}>
            <Text style={styles.gainPillText}>
              {enabled ? `${formatGain(Math.max(...bands))} dB peak` : 'Bypassed'}
            </Text>
          </View>
        </View>

        <View style={styles.bands}>
          {eqLabels.map((label, index) => (
            <View key={label} style={styles.band}>
              <Text style={styles.bandValue}>{formatGain(bands[index] ?? 0)}</Text>
              <VerticalSlider
                value={bands[index] ?? 0}
                min={-MAX_GAIN}
                max={MAX_GAIN}
                height={146}
                onChange={(value) => {
                  if (!enabled) setEnabled(true);
                  setBand(index, value);
                }}
              />
              <Text style={styles.bandLabel}>{label}</Text>
              <Text style={styles.bandUnit}>Hz</Text>
            </View>
          ))}
        </View>

        <View style={styles.scaleRow}>
          <Text style={styles.scaleText}>−{MAX_GAIN} dB</Text>
          <View style={styles.scaleLine} />
          <Text style={styles.scaleText}>0</Text>
          <View style={styles.scaleLine} />
          <Text style={styles.scaleText}>+{MAX_GAIN} dB</Text>
        </View>
      </View>

      <View style={styles.presetHeader}>
        <Text style={styles.sectionTitle}>Presets</Text>
        {presetId === 'custom' ? (
          <View style={styles.customTag}>
            <Text style={styles.customTagText}>CUSTOM</Text>
          </View>
        ) : null}
      </View>
      <ChipRow>
        {eqPresets.map((preset) => (
          <Chip
            key={preset.id}
            label={preset.name}
            active={preset.id === presetId}
            onPress={() => handlePreset(preset.id)}
          />
        ))}
      </ChipRow>

      <SettingSection title="Enhancers">
        <View style={[styles.enhancer, !enabled && styles.dimmed]}>
          <View style={styles.enhancerHead}>
            <View style={styles.enhancerIcon}>
              <Icon name="volume" size={16} color={colors.accentLight} />
            </View>
            <View style={styles.enhancerCopy}>
              <Text style={styles.enhancerLabel}>Bass boost</Text>
              <Text style={styles.enhancerHint}>Low-end weight and punch</Text>
            </View>
            <Text style={styles.enhancerValue}>{formatGain(bassBoost)}</Text>
          </View>
          <BiSlider
            value={bassBoost}
            onChange={(value) => {
              if (!enabled) setEnabled(true);
              setBassBoost(value);
            }}
          />
        </View>

        <View style={[styles.enhancer, !enabled && styles.dimmed]}>
          <View style={styles.enhancerHead}>
            <View style={styles.enhancerIcon}>
              <Icon name="mic" size={16} color={colors.accentLight} />
            </View>
            <View style={styles.enhancerCopy}>
              <Text style={styles.enhancerLabel}>Vocal</Text>
              <Text style={styles.enhancerHint}>Lift voices above the mix</Text>
            </View>
            <Text style={styles.enhancerValue}>{formatGain(vocal)}</Text>
          </View>
          <BiSlider
            value={vocal}
            onChange={(value) => {
              if (!enabled) setEnabled(true);
              setVocal(value);
            }}
          />
        </View>

        <View style={[styles.enhancer, styles.enhancerLast, !enabled && styles.dimmed]}>
          <View style={styles.enhancerHead}>
            <View style={styles.enhancerIcon}>
              <Icon name="sparkles" size={16} color={colors.accentLight} />
            </View>
            <View style={styles.enhancerCopy}>
              <Text style={styles.enhancerLabel}>Treble</Text>
              <Text style={styles.enhancerHint}>Air, cymbals and detail</Text>
            </View>
            <Text style={styles.enhancerValue}>{formatGain(treble)}</Text>
          </View>
          <BiSlider
            value={treble}
            onChange={(value) => {
              if (!enabled) setEnabled(true);
              setTreble(value);
            }}
          />
        </View>
      </SettingSection>

      <View style={styles.actions}>
        <Button
          label="Reset to flat"
          icon="refresh"
          variant="secondary"
          onPress={handleReset}
          style={styles.actionButton}
        />
        <Button
          label={enabled ? 'Disable EQ' : 'Enable EQ'}
          icon={enabled ? 'pause' : 'play'}
          variant={enabled ? 'danger' : 'primary'}
          onPress={() => setEnabled(!enabled)}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.note}>
        <Icon name="info" size={12} color={colors.textMuted} />
        <Text style={styles.noteText}>
          The equalizer is processed live inside NKfy&apos;s audio engine. Bluetooth route changes,
          interruptions and lock-screen controls keep working while it is enabled.
        </Text>
      </View>
    </Screen>
  );
}

function BiSlider({
  value,
  onChange,
  accent = colors.accent,
}: {
  value: number;
  onChange: (value: number) => void;
  accent?: string;
}) {
  const widthRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const update = (x: number) => {
    const width = widthRef.current;
    if (width <= 0) return;
    const ratio = clamp(x / width, 0, 1);
    onChangeRef.current(Math.round((-MAX_GAIN + ratio * MAX_GAIN * 2) * 10) / 10);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setDragging(true);
          update(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => update(event.nativeEvent.locationX),
        onPanResponderRelease: () => setDragging(false),
        onPanResponderTerminate: () => setDragging(false),
      }),
      [],
    );

  const ratio = clamp((value + MAX_GAIN) / (MAX_GAIN * 2), 0, 1);
  const thumbPercent = `${ratio * 100}%` as const;
  const fillLeft = ratio >= 0.5 ? '50%' : thumbPercent;
  const fillWidth = `${Math.abs(ratio - 0.5) * 100}%` as const;

  return (
    <View
      style={styles.biTouch}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width;
      }}
      {...responder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: -MAX_GAIN, max: MAX_GAIN, now: Math.round(value) }}
    >
      <View style={styles.biRail}>
        <View style={styles.biCenter} />
        <View
          style={[styles.biFill, { left: fillLeft, width: fillWidth, backgroundColor: accent }]}
        />
      </View>
      <View
        style={[
          styles.biThumb,
          {
            left: thumbPercent,
            backgroundColor: accent,
            transform: [{ scale: dragging ? 1.18 : 1 }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
    overflow: 'hidden',
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  heroEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 1.2,
    color: colors.accentLight,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.4,
    color: colors.text,
  },
  heroText: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  bandCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  dimmed: {
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  cardHint: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  gainPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.accentFaint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
  },
  gainPillText: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: colors.accentLight,
  },
  bands: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  band: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  bandValue: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textSecondary,
    minWidth: 24,
    textAlign: 'center',
  },
  bandLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.text,
    marginTop: 2,
  },
  bandUnit: {
    fontFamily: fonts.regular,
    fontSize: 8,
    color: colors.textMuted,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  scaleText: {
    fontFamily: fonts.regular,
    fontSize: 8.5,
    color: colors.textMuted,
  },
  scaleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  customTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.accentSoft,
  },
  customTagText: {
    fontFamily: fonts.semibold,
    fontSize: 8,
    letterSpacing: 0.5,
    color: colors.accentLight,
  },
  enhancer: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: 2,
  },
  enhancerLast: {
    borderBottomWidth: 0,
  },
  enhancerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  enhancerIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancerCopy: {
    flex: 1,
    gap: 1,
  },
  enhancerLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  enhancerHint: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  enhancerValue: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 28,
    textAlign: 'right',
  },
  biTouch: {
    height: 30,
    justifyContent: 'center',
    marginTop: 4,
  },
  biRail: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  biCenter: {
    position: 'absolute',
    left: '50%',
    top: -3,
    bottom: -3,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  biFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  biThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    borderWidth: 2.5,
    borderColor: colors.surface,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  actionButton: {
    flex: 1,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    flex: 1,
  },
});
