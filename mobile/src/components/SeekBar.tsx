import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';
import { clamp } from '@/utils/array';

interface SeekBarProps {
  value: number;
  max: number;
  onSeek: (value: number) => void;
  onSeekingChange?: (seeking: boolean) => void;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

export function SeekBar({
  value,
  max,
  onSeek,
  onSeekingChange,
  accent = colors.accent,
  style,
}: SeekBarProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const widthRef = useRef(0);
  const maxRef = useRef(max);
  const draggingRef = useRef<number | null>(null);
  maxRef.current = max;

  const setFromX = (x: number) => {
    const width = widthRef.current;
    if (width <= 0) return;
    const ratio = clamp(x / width, 0, 1);
    const next = ratio * (maxRef.current || 1);
    draggingRef.current = next;
    setDragging(next);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          onSeekingChange?.(true);
          setFromX(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          setFromX(event.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          const next = draggingRef.current;
          draggingRef.current = null;
          setDragging(null);
          onSeekingChange?.(false);
          if (next !== null) onSeek(next);
        },
        onPanResponderTerminate: () => {
          draggingRef.current = null;
          setDragging(null);
          onSeekingChange?.(false);
        },
      }),
    // PanResponder only needs stable config; values are read from refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const display = dragging ?? value;
  const ratio = max > 0 ? clamp(display / max, 0, 1) : 0;
  const progressPercent = `${ratio * 100}%` as const;

  return (
    <View
      style={[styles.touchArea, style]}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width;
      }}
      {...panResponder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max: Math.round(max), now: Math.round(display) }}
    >
      <View style={styles.rail}>
        <View style={[styles.fill, { width: progressPercent, backgroundColor: accent }]} />
      </View>
      <View
        style={[
          styles.thumb,
          {
            left: progressPercent,
            backgroundColor: accent,
            transform: [{ scale: dragging !== null ? 1.15 : 1 }],
          },
        ]}
      />
    </View>
  );
}

export function ProgressBar({
  ratio,
  height = 2,
  color = colors.textSecondary,
  trackColor = 'rgba(255,255,255,0.12)',
  style,
}: {
  ratio: number;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const percent = `${clamp(ratio, 0, 1) * 100}%` as const;
  return (
    <View style={[{ height, backgroundColor: trackColor, borderRadius: height }, style]}>
      <View style={{ height, width: percent, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

interface VerticalSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  height?: number;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

export function VerticalSlider({
  value,
  min,
  max,
  onChange,
  height = 150,
  accent = colors.accent,
  style,
}: VerticalSliderProps) {
  const heightRef = useRef(height);
  const range = max - min;
  const ratio = clamp((value - min) / (range || 1), 0, 1);
  const centerRatio = clamp((0 - min) / (range || 1), 0, 1);
  const [dragging, setDragging] = useState(false);

  const update = (y: number) => {
    const usable = heightRef.current;
    const next = clamp(1 - y / usable, 0, 1);
    onChange(min + next * range);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setDragging(true);
          update(event.nativeEvent.locationY);
        },
        onPanResponderMove: (event) => update(event.nativeEvent.locationY),
        onPanResponderRelease: () => setDragging(false),
        onPanResponderTerminate: () => setDragging(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max]
  );

  const fillBottom = Math.min(ratio, centerRatio) * height;
  const fillHeight = Math.abs(ratio - centerRatio) * height;

  return (
    <View
      style={[{ width: 40, height, alignItems: 'center', justifyContent: 'center' }, style]}
      onLayout={(event) => {
        heightRef.current = event.nativeEvent.layout.height;
      }}
      {...panResponder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: Math.round(value) }}
    >
      <View style={styles.verticalRail}>
        <View style={styles.verticalCenter} />
        <View
          style={[
            styles.verticalFill,
            { bottom: fillBottom, height: fillHeight, backgroundColor: accent },
          ]}
        />
      </View>
      <View
        style={[
          styles.verticalThumb,
          {
            bottom: ratio * height - 9,
            backgroundColor: accent,
            transform: [{ scale: dragging ? 1.18 : 1 }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    height: 28,
    justifyContent: 'center',
  },
  rail: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  verticalRail: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  verticalCenter: {
    position: 'absolute',
    top: '50%',
    left: -3,
    right: -3,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  verticalFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 2,
  },
  verticalThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.background,
  },
});
