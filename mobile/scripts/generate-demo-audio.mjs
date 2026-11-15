/**
 * Generates the original NKfy demo tracks bundled with the app.
 * The audio is synthesized from scratch (no samples, no third-party music),
 * so the demo library is safe to ship and works fully offline.
 *
 * Usage: node scripts/generate-demo-audio.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'assets', 'audio');
mkdirSync(outDir, { recursive: true });

const SAMPLE_RATE = 22050;
const DURATION = 36;

const midi = (note) => 440 * Math.pow(2, (note - 69) / 12);

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeTrack({ seed, bpm, root, chords, arpPattern, brightness, name }) {
  const random = mulberry32(seed);
  const total = Math.floor(SAMPLE_RATE * DURATION);
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  const beat = 60 / bpm;
  const bar = beat * 4;

  const add = (index, value, pan = 0) => {
    if (index < 0 || index >= total) return;
    left[index] += value * (1 - Math.max(0, pan));
    right[index] += value * (1 + Math.min(0, pan));
  };

  // Warm evolving pad.
  for (let barIndex = 0; barIndex * bar < DURATION; barIndex += 1) {
    const chord = chords[barIndex % chords.length];
    const start = barIndex * bar;
    for (const note of chord) {
      const freq = midi(note);
      const pan = (note % 5) / 10 - 0.2;
      for (let t = 0; t < bar * 1.08; t += 1 / SAMPLE_RATE) {
        const time = start + t;
        if (time >= DURATION) break;
        const attack = Math.min(1, t / 1.8);
        const release = Math.min(1, (bar * 1.08 - t) / 1.2);
        const env = attack * release;
        const index = Math.floor(time * SAMPLE_RATE);
        const drift = Math.sin(t * 0.17 + note) * 0.6;
        const value =
          (Math.sin(2 * Math.PI * (freq + drift) * t) * 0.5 +
            Math.sin(2 * Math.PI * freq * 2 * t + 0.4) * 0.16 +
            Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.22) *
          0.075 *
          env;
        add(index, value, pan);
      }
    }
  }

  // Plucked arpeggio.
  const step = beat / 2;
  let arpIndex = 0;
  for (let time = 0; time < DURATION; time += step) {
    const chord = chords[Math.floor(time / bar) % chords.length];
    const note = chord[arpPattern[arpIndex % arpPattern.length] % chord.length] + 12;
    const freq = midi(note);
    const amplitude = 0.055 * (0.7 + random() * 0.5);
    const decay = 0.9 + brightness * 0.4;
    const pan = Math.sin(arpIndex * 0.9) * 0.35;
    const startIndex = Math.floor(time * SAMPLE_RATE);
    const length = Math.floor(SAMPLE_RATE * 0.7);
    for (let i = 0; i < length; i += 1) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * (5.5 * decay));
      const tone =
        Math.sin(2 * Math.PI * freq * t) * 0.7 +
        Math.sin(2 * Math.PI * freq * 3 * t) * 0.16 * brightness +
        Math.sin(2 * Math.PI * freq * 5 * t) * 0.06 * brightness;
      add(startIndex + i, tone * env * amplitude, pan);
    }
    arpIndex += 1;
  }

  // Sub bass on every beat.
  for (let time = 0; time < DURATION; time += beat) {
    const chord = chords[Math.floor(time / bar) % chords.length];
    const freq = midi(chord[0] - 12);
    const startIndex = Math.floor(time * SAMPLE_RATE);
    const length = Math.floor(SAMPLE_RATE * beat * 0.9);
    for (let i = 0; i < length; i += 1) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 3.2) + 0.18;
      add(startIndex + i, Math.sin(2 * Math.PI * freq * t) * env * 0.16);
    }
  }

  // Soft kick + brushed hats.
  for (let time = 0; time < DURATION; time += beat) {
    const startIndex = Math.floor(time * SAMPLE_RATE);
    const length = Math.floor(SAMPLE_RATE * 0.24);
    for (let i = 0; i < length; i += 1) {
      const t = i / SAMPLE_RATE;
      const freq = 105 * Math.exp(-t * 18) + 38;
      const env = Math.exp(-t * 11);
      add(startIndex + i, Math.sin(2 * Math.PI * freq * t) * env * 0.22);
    }

    const hatStart = Math.floor((time + beat / 2) * SAMPLE_RATE);
    const hatLength = Math.floor(SAMPLE_RATE * 0.055);
    for (let i = 0; i < hatLength; i += 1) {
      const t = i / SAMPLE_RATE;
      add(hatStart + i, (random() * 2 - 1) * Math.exp(-t * 65) * 0.018, 0.3);
    }
  }

  // Gentle master fades and normalization.
  const fade = Math.floor(SAMPLE_RATE * 2.5);
  let peak = 0;
  for (let i = 0; i < total; i += 1) {
    const fadeGain = Math.min(1, i / fade, (total - i) / fade);
    left[i] *= fadeGain;
    right[i] *= fadeGain;
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  const gain = peak > 0 ? 0.82 / peak : 1;

  const buffer = Buffer.alloc(44 + total * 4);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + total * 4, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(total * 4, 40);

  for (let i = 0; i < total; i += 1) {
    const l = Math.max(-1, Math.min(1, left[i] * gain));
    const r = Math.max(-1, Math.min(1, right[i] * gain));
    buffer.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }

  const path = join(outDir, `${name}.wav`);
  writeFileSync(path, buffer);
  console.log(`wrote ${path} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
}

makeTrack({
  name: 'midnight-circuit',
  seed: 7,
  bpm: 86,
  root: 45,
  chords: [
    [57, 60, 64, 67],
    [53, 57, 60, 64],
    [55, 59, 62, 65],
    [50, 53, 57, 60],
  ],
  arpPattern: [0, 2, 3, 1, 2, 0, 3, 1],
  brightness: 1,
});

makeTrack({
  name: 'blue-hour',
  seed: 21,
  bpm: 74,
  root: 43,
  chords: [
    [55, 58, 62, 65],
    [50, 53, 57, 60],
    [53, 57, 60, 64],
    [48, 52, 55, 59],
  ],
  arpPattern: [0, 1, 2, 3, 2, 1, 3, 2],
  brightness: 0.6,
});

makeTrack({
  name: 'signal-rain',
  seed: 42,
  bpm: 92,
  root: 48,
  chords: [
    [60, 63, 67, 70],
    [58, 62, 65, 69],
    [55, 58, 62, 65],
    [53, 57, 60, 64],
  ],
  arpPattern: [0, 2, 1, 3, 0, 1, 2, 3],
  brightness: 1.3,
});

makeTrack({
  name: 'slow-horizon',
  seed: 99,
  bpm: 68,
  root: 41,
  chords: [
    [53, 57, 60, 64],
    [48, 52, 55, 59],
    [50, 53, 57, 60],
    [46, 50, 53, 57],
  ],
  arpPattern: [0, 3, 1, 2, 3, 0, 2, 1],
  brightness: 0.45,
});
