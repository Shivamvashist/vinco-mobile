/**
 * Renders the Vinco UI sound set to WAV files.
 *
 * The recipes mirror the WebAudio sounds in the UI prototype
 * (docs/v1-reference/Vinco app UI.html), so the app sounds the same as the design.
 *
 * Usage:   node scripts/generate-sounds.mjs
 * Output:  assets/sounds/vinco/<cue>.wav   (44.1 kHz, 16-bit, mono)
 *
 * To add a sound theme later: copy the RECIPES object, change the notes,
 * write to a new folder, and register it in src/theme/sounds.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44100;
const SILENCE = 0.0001;
const TAIL_FADE_SECONDS = 0.01;
const TARGET_PEAK = 0.9;
const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds', 'vinco');

/** Deterministic noise so the files are identical on every run. */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/** Band-limited waveform value for a phase in radians. */
function waveSample(type, phase, frequency) {
  if (type === 'sine') return Math.sin(phase);
  const maxHarmonic = Math.max(1, Math.floor(18000 / Math.max(frequency, 1)));
  let value = 0;
  if (type === 'triangle') {
    for (let k = 0; 2 * k + 1 <= maxHarmonic; k++) {
      const n = 2 * k + 1;
      value += ((k % 2 === 0 ? 1 : -1) * Math.sin(n * phase)) / (n * n);
    }
    return (8 / (Math.PI * Math.PI)) * value;
  }
  if (type === 'sawtooth') {
    for (let n = 1; n <= maxHarmonic; n++) {
      value += ((n % 2 === 1 ? 1 : -1) * Math.sin(n * phase)) / n;
    }
    return (2 / Math.PI) * value;
  }
  throw new Error(`Unknown wave type: ${type}`);
}

/** Exponential ramp between two positive values, like WebAudio's exponentialRampToValueAtTime. */
function expRamp(from, to, progress) {
  const p = Math.min(1, Math.max(0, progress));
  return from * Math.pow(to / from, p);
}

/**
 * A tone: oscillator with an attack ramp from silence to `volume`, then a decay to silence.
 * attack = 0 starts at full volume (matches setValueAtTime(volume) in the prototype).
 * sweepTo + sweepTime glide the pitch exponentially, then hold.
 */
function renderTone(
  buffer,
  { at = 0, frequency, sweepTo, sweepTime = 0, type = 'sine', volume, attack = 0.015, length },
) {
  const start = Math.floor(at * SAMPLE_RATE);
  const total = Math.floor((length + 0.05) * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < total && start + i < buffer.length; i++) {
    const t = i / SAMPLE_RATE;
    const freq = sweepTo ? expRamp(frequency, sweepTo, sweepTime > 0 ? t / sweepTime : 1) : frequency;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    let gain;
    if (attack > 0 && t < attack) gain = expRamp(SILENCE, volume, t / attack);
    else if (t <= length) gain = expRamp(volume, SILENCE, (t - attack) / Math.max(length - attack, 1e-6));
    else gain = 0;
    buffer[start + i] += gain * waveSample(type, phase, freq);
  }
}

/** A burst of white noise with a polynomial decay (1 = linear, 2 = quadratic). */
function renderNoise(buffer, { at = 0, length, volume, curve = 1, seed = 7 }) {
  const random = createRandom(seed);
  const start = Math.floor(at * SAMPLE_RATE);
  const total = Math.floor(length * SAMPLE_RATE);
  for (let i = 0; i < total && start + i < buffer.length; i++) {
    const envelope = Math.pow(1 - i / total, curve);
    buffer[start + i] += volume * (random() * 2 - 1) * envelope;
  }
}

const tone = (options) => ({ kind: 'tone', ...options });
const noise = (options) => ({ kind: 'noise', ...options });
/** A run of notes spaced `gap` seconds apart, starting at `at`. */
const notes = (frequencies, { gap, at = 0, ...rest }) =>
  frequencies.map((frequency, k) => tone({ ...rest, frequency, at: at + k * gap }));

/** Each cue: total duration in seconds and its layers. Names match SoundCue in src/theme/sounds. */
const RECIPES = {
  // Today: a task tap (+1 L, +1 meal)
  tap: {
    duration: 0.2,
    layers: [
      tone({ frequency: 880, type: 'triangle', volume: 0.1, length: 0.08 }),
      tone({ frequency: 1320, at: 0.03, volume: 0.05, length: 0.1 }),
    ],
  },
  // Picking an option card (arc length, tone)
  select: {
    duration: 0.18,
    layers: [
      tone({
        frequency: 660,
        sweepTo: 990,
        sweepTime: 0.06,
        type: 'triangle',
        volume: 0.12,
        attack: 0,
        length: 0.12,
      }),
    ],
  },
  // Segmented control or small toggle
  toggle: {
    duration: 0.14,
    layers: [tone({ frequency: 760, type: 'triangle', volume: 0.08, attack: 0, length: 0.08 })],
  },
  // Stepper + and -
  stepUp: { duration: 0.15, layers: [tone({ frequency: 880, volume: 0.1, attack: 0, length: 0.09 })] },
  stepDown: { duration: 0.15, layers: [tone({ frequency: 587, volume: 0.1, attack: 0, length: 0.09 })] },
  // A task reaches its full goal
  win: {
    duration: 0.6,
    layers: notes([659.25, 830.61, 987.77], { gap: 0.07, type: 'triangle', volume: 0.09, length: 0.35 }),
  },
  // The VINCO stamp: low thud, then a rising brass figure
  stamp: {
    duration: 1.2,
    layers: [
      tone({ frequency: 130, sweepTo: 40, sweepTime: 0.35, volume: 0.45, attack: 0, length: 0.45 }),
      ...notes([392, 493.88, 587.33, 783.99], {
        at: 0.3,
        gap: 0.11,
        type: 'sawtooth',
        volume: 0.06,
        length: 0.6,
      }),
    ],
  },
  // Cross the Rubicon
  cross: {
    duration: 1.0,
    layers: [
      tone({ frequency: 140, sweepTo: 48, sweepTime: 0.35, volume: 0.35, attack: 0, length: 0.45 }),
      ...notes([392, 523.25, 659.25], {
        at: 0.18,
        gap: 0.12,
        type: 'sawtooth',
        volume: 0.05,
        attack: 0.03,
        length: 0.5,
      }),
    ],
  },
  // Splash "Enter"
  chime: {
    duration: 0.8,
    layers: notes([523.25, 783.99], { gap: 0.09, volume: 0.12, attack: 0.02, length: 0.6 }),
  },
  // Share or save confirmed
  confirm: {
    duration: 0.7,
    layers: notes([783.99, 1046.5], { gap: 0.08, volume: 0.1, attack: 0.02, length: 0.5 }),
  },
  // Voice recording starts and is sealed
  recordStart: {
    duration: 0.2,
    layers: [tone({ frequency: 880, volume: 0.12, attack: 0.02, length: 0.15 })],
  },
  recordStop: {
    duration: 1.0,
    layers: notes([196, 261.63, 392], {
      gap: 0.1,
      type: 'triangle',
      volume: 0.12,
      attack: 0.02,
      length: 0.7,
    }),
  },
  // Daily selfie shutter
  shutter: {
    duration: 0.15,
    layers: [
      noise({ length: 0.04, volume: 0.3, curve: 2, seed: 11 }),
      noise({ at: 0.07, length: 0.04, volume: 0.3, curve: 2, seed: 23 }),
    ],
  },
  // First selfie: shutter, then the DAY I stamp thud
  seal: {
    duration: 0.8,
    layers: [
      noise({ length: 0.06, volume: 0.25, seed: 5 }),
      tone({ at: 0.32, frequency: 120, sweepTo: 40, sweepTime: 0.3, volume: 0.4, attack: 0, length: 0.4 }),
    ],
  },
  // Resurgo: rise again
  rise: {
    duration: 0.9,
    layers: notes([261.63, 329.63, 392, 523.25], {
      gap: 0.12,
      type: 'triangle',
      volume: 0.1,
      attack: 0.02,
      length: 0.45,
    }),
  },
  // Truce used
  truce: {
    duration: 0.6,
    layers: notes([440, 554.37], { gap: 0.1, volume: 0.1, attack: 0.02, length: 0.4 }),
  },
  // Tapped something locked or unavailable
  denied: {
    duration: 0.2,
    layers: [tone({ frequency: 330, type: 'triangle', volume: 0.1, attack: 0, length: 0.15 })],
  },
};

function renderCue({ duration, layers }) {
  const buffer = new Float32Array(Math.ceil(duration * SAMPLE_RATE));
  for (const layer of layers) {
    if (layer.kind === 'tone') renderTone(buffer, layer);
    else renderNoise(buffer, layer);
  }
  const fade = Math.floor(TAIL_FADE_SECONDS * SAMPLE_RATE);
  for (let i = 0; i < fade; i++) buffer[buffer.length - 1 - i] *= i / fade;
  return buffer;
}

function encodeWav(samples, gain) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const out = Buffer.alloc(44 + dataSize);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + dataSize, 4);
  out.write('WAVE', 8);
  out.write('fmt ', 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); // PCM
  out.writeUInt16LE(1, 22); // mono
  out.writeUInt32LE(SAMPLE_RATE, 24);
  out.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  out.writeUInt16LE(bytesPerSample, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i] * gain));
    out.writeInt16LE(Math.round(clamped * 32767), 44 + i * bytesPerSample);
  }
  return out;
}

const rendered = Object.entries(RECIPES).map(([name, recipe]) => [name, renderCue(recipe)]);
// One shared gain keeps the relative loudness from the prototype.
const loudestPeak = Math.max(
  ...rendered.map(([, samples]) => samples.reduce((max, s) => Math.max(max, Math.abs(s)), 0)),
);
if (!Number.isFinite(loudestPeak) || loudestPeak <= 0)
  throw new Error('Rendered sounds are silent; check RECIPES.');
const sharedGain = TARGET_PEAK / loudestPeak;

mkdirSync(OUTPUT_DIR, { recursive: true });
for (const [name, samples] of rendered) {
  const file = join(OUTPUT_DIR, `${name}.wav`);
  writeFileSync(file, encodeWav(samples, sharedGain));
  console.log(`${name}.wav  ${(samples.length / SAMPLE_RATE).toFixed(2)}s`);
}
console.log(`Wrote ${rendered.length} sounds to ${OUTPUT_DIR} (gain ${sharedGain.toFixed(2)}).`);
