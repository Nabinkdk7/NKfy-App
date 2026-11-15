import {
  Audio,
  AudioContext,
  AudioManager,
  PlaybackNotificationManager,
  type AudioTagHandle,
  type BiquadFilterNode,
} from 'react-native-audio-api';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { recordRecent, trackAt, usePlayerStore } from '@/stores/playerStore';
import { useEqualizerStore } from '@/stores/equalizerStore';
import { toast } from '@/stores/uiStore';
import { resolveArtworkUri } from '@/utils/artwork';

interface FilterChain {
  source: ReturnType<AudioContext['createMediaElementSource']>;
  bass: BiquadFilterNode;
  bands: BiquadFilterNode[];
  vocal: BiquadFilterNode;
  treble: BiquadFilterNode;
  output: ReturnType<AudioContext['createGain']>;
}

export function AudioHost() {
  const track = usePlayerStore((state) => trackAt(state));
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const seekRequest = usePlayerStore((state) => state.seekRequest);
  const trackNonce = usePlayerStore((state) => state.trackNonce);
  const positionTick = usePlayerStore((state) => Math.floor(state.position));
  const equalizer = useEqualizerStore();

  const audioRef = useRef<AudioTagHandle | null>(null);
  const chainRef = useRef<FilterChain | null>(null);
  const loadedTrackRef = useRef<string | null>(null);
  const endedFiredRef = useRef(false);
  const lastNotificationRef = useRef({ key: '', at: 0 });
  const [chainVersion, setChainVersion] = useState(0);

  const context = useMemo(() => {
    try {
      return new AudioContext({ latencyHint: 'interactive' });
    } catch {
      return null;
    }
  }, []);

  const playable = Boolean(track?.isPlayable && track?.url);

  const connectEqualizer = useCallback(
    (element: AudioTagHandle | null) => {
      if (!element || !context) return;
      try {
        const source = context.createMediaElementSource(element);
        try {
          chainRef.current?.source.disconnect();
        } catch {
          // Previous source is already disposed.
        }

        const bass = context.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 120;

        const frequencies = [60, 230, 910, 3600, 14000];
        const bands = frequencies.map((frequency) => {
          const filter = context.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = frequency;
          filter.Q.value = 1.05;
          return filter;
        });

        const vocal = context.createBiquadFilter();
        vocal.type = 'peaking';
        vocal.frequency.value = 2600;
        vocal.Q.value = 1.2;

        const treble = context.createBiquadFilter();
        treble.type = 'highshelf';
        treble.frequency.value = 9000;

        const output = context.createGain();
        output.gain.value = 0.92;

        source.connect(bass);
        let previous: BiquadFilterNode = bass;
        for (const band of bands) {
          previous.connect(band);
          previous = band;
        }
        previous.connect(vocal);
        vocal.connect(treble);
        treble.connect(output);
        output.connect(context.destination);

        chainRef.current = { source, bass, bands, vocal, treble, output };
        setChainVersion((value) => value + 1);
      } catch {
        // The element may not have produced a file source yet; a later load will retry.
      }
    },
    [context]
  );

  const applyEqualizer = useCallback(() => {
    const chain = chainRef.current;
    if (!chain) return;
    const { enabled, bands, bassBoost, vocal, treble } = useEqualizerStore.getState();
    try {
      chain.bass.gain.value = enabled ? bassBoost : 0;
      chain.bands.forEach((filter, index) => {
        filter.gain.value = enabled ? (bands[index] ?? 0) : 0;
      });
      chain.vocal.gain.value = enabled ? vocal : 0;
      chain.treble.gain.value = enabled ? treble : 0;
    } catch {
      // Filters can be disposed while a new track is loading.
    }
  }, []);

  useEffect(() => {
    applyEqualizer();
  }, [
    applyEqualizer,
    chainVersion,
    equalizer.enabled,
    equalizer.bands,
    equalizer.bassBoost,
    equalizer.vocal,
    equalizer.treble,
  ]);

  useEffect(() => {
    const subscription = useEqualizerStore.subscribe(applyEqualizer);
    return () => subscription();
  }, [applyEqualizer]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    try {
      AudioManager.setSystemOptions({
        ios: {
          category: 'playback',
          mode: 'default',
          options: ['allowAirPlay', 'allowBluetoothA2DP'],
        },
      });
      AudioManager.observeAudioInterruptions(true);
      void AudioManager.requestNotificationPermissions();
    } catch {
      // Audio session tuning is best-effort and unsupported on some platforms.
    }

    const interruption = AudioManager.addSystemEventListener('interruption', (event) => {
      if (event.type === 'began') {
        usePlayerStore.getState().setPlaying(false);
      } else if (event.shouldResume) {
        usePlayerStore.getState().setPlaying(true);
      }
    });

    const routeChange = AudioManager.addSystemEventListener('routeChange', (event) => {
      if (event.reason === 'OldDeviceUnavailable') {
        usePlayerStore.getState().setPlaying(false);
      }
    });

    return () => {
      interruption?.remove();
      routeChange?.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscriptions = [
      PlaybackNotificationManager.addEventListener('playbackNotificationPlay', () => {
        usePlayerStore.getState().setPlaying(true);
      }),
      PlaybackNotificationManager.addEventListener('playbackNotificationPause', () => {
        usePlayerStore.getState().setPlaying(false);
      }),
      PlaybackNotificationManager.addEventListener('playbackNotificationNextTrack', () => {
        usePlayerStore.getState().next();
      }),
      PlaybackNotificationManager.addEventListener('playbackNotificationPreviousTrack', () => {
        usePlayerStore.getState().previous();
      }),
      PlaybackNotificationManager.addEventListener('playbackNotificationSeekTo', (event) => {
        usePlayerStore.getState().seek(event.value);
      }),
      PlaybackNotificationManager.addEventListener('playbackNotificationSkipForward', (event) => {
        const state = usePlayerStore.getState();
        state.seek(state.position + event.value);
      }),
      PlaybackNotificationManager.addEventListener('playbackNotificationSkipBackward', (event) => {
        const state = usePlayerStore.getState();
        state.seek(state.position - event.value);
      }),
    ];

    return () => subscriptions.forEach((subscription) => subscription?.remove());
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playable) return;

    if (isPlaying) {
      try {
        AudioManager.setAudioSessionActivity(true).catch(() => undefined);
      } catch {
        // Ignore unsupported session activation.
      }
      if (context && context.state !== 'running') {
        context.resume().catch(() => undefined);
      }
      audio.play();
    } else {
      audio.pause();
      if (Platform.OS === 'web' && context) context.suspend().catch(() => undefined);
    }
  }, [context, isPlaying, playable, track?.id]);

  useEffect(() => {
    if (!track || !isPlaying) return;
    recordRecent(track);
  }, [track, isPlaying]);

  useEffect(() => {
    if (!seekRequest) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.seekToTime(seekRequest.seconds);
  }, [seekRequest]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!track) {
      void PlaybackNotificationManager.hide().catch(() => undefined);
      return;
    }

    const now = Date.now();
    const key = `${track.id}:${isPlaying ? 'playing' : 'paused'}`;
    const previous = lastNotificationRef.current;
    const stateChanged = previous.key !== key;
    if (!stateChanged && now - previous.at < 1200) return;

    lastNotificationRef.current = { key, at: now };
    const artwork = resolveArtworkUri(track.artwork);
    void PlaybackNotificationManager.show({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: artwork && (artwork.startsWith('http') || artwork.startsWith('file:'))
        ? artwork
        : undefined,
      duration: track.duration || undefined,
      elapsedTime: usePlayerStore.getState().position,
      state: isPlaying ? 'playing' : 'paused',
    }).catch(() => undefined);
  }, [isPlaying, track, equalizer.enabled, positionTick]);

  const handleLoad = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    loadedTrackRef.current = track?.id ?? null;
    endedFiredRef.current = false;
    connectEqualizer(audio);
    applyEqualizer();

    if (audioRef.current && usePlayerStore.getState().isPlaying) {
      audioRef.current.play();
    }
    if (track?.duration) {
      usePlayerStore.getState().setDuration(track.duration);
    }
  }, [track]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnded = useCallback(() => {
    if (endedFiredRef.current) return;
    const state = usePlayerStore.getState();
    const duration = state.duration || track?.duration || 0;
    // Ignore spurious ended events that fire before the track actually finished.
    if (duration > 0 && state.position < duration - 1) return;
    endedFiredRef.current = true;
    state.next(true);
  }, [track]);

  const handleError = useCallback(() => {
    usePlayerStore.getState().setPlaying(false);
    toast('This track could not be played. Try another source.', 'error');
  }, []);

  if (!playable || !track?.url) {
    return <View pointerEvents="none" style={{ height: 0, width: 0 }} />;
  }

  return (
    <View pointerEvents="none" style={{ height: 0, width: 0 }}>
      <Audio
        key={`${track.id}:${trackNonce}`}
        ref={audioRef}
        source={track.url}
        context={context ?? undefined}
        preload="auto"
        autoPlay={false}
        volume={1}
        onLoad={handleLoad}
        onEnded={handleEnded}
        onError={handleError}
        onPositionChange={(seconds) => {
          usePlayerStore.getState().setPosition(seconds);
        }}
      />
    </View>
  );
}
