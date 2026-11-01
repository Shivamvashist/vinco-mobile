/**
 * Renders the focus rain: a soft, seamless loop for the rain tile on the running focus.
 *
 * Usage:   node scripts/generate-rain.mjs     (npm run sounds:rain)
 * Output:  assets/sounds/ambient/rain.wav     (22.05 kHz, 16-bit, mono, 24 s, about 1 MB)
 *
 * The recipe: a bed of pink and brown noise, filtered so it is warm rather than hissy, with a slow
 * swell; then thousands of tiny droplets (short bursts of band-passed noise, a few with a soft
 * "plip"). The last two seconds are crossfaded into the first two (equal power), so the end flows
 * into the start with no click or gap when the player loops it. Deterministic: the same file on
 * every run. 22.05 kHz is plenty for rain (nothing useful above 11 kHz) and halves the size.
 * There is no ogg or m4a encoder in the toolchain, so the file is WAV; Android plays it natively.
 */
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const LOOP_SECONDS = 24;
const SEAM_SECONDS = 2;
/** Peak of the finished loop, as a share of full scale (about -5 dBFS). The app plays it softer. */
const PEAK = 0.56;
const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds', 'ambient');

/** Deterministic noise so the file is identical on every run. */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/** One-pole low-pass coefficient for a cutoff in Hz. */
const lowPassCoefficient = (cutoff) => 1 - Math.exp((-2 * Math.PI * cutoff) / SAMPLE_RATE);

/** The bed: pink noise (Paul Kellet's filter) with a little brown noise under it, filtered warm. */
function renderBed(buffer, random) {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let brown = 0;
  let low = 0;
  let lowSecond = 0;
  let highState = 0;
  const lowA = lowPassCoefficient(3200);
  const highA = lowPassCoefficient(140);
  for (let i = 0; i < buffer.length; i++) {
    const white = random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    brown = (brown + 0.02 * white) / 1.02;
    const mixed = pink * 0.8 + brown * 2.4;
    // Two low-pass stages (gentle 12 dB slope), then a high-pass to keep phone speakers clean.
    low += lowA * (mixed - low);
    lowSecond += lowA * (low - lowSecond);
    highState += highA * (lowSecond - highState);
    const high = lowSecond - highState;
    // A slow swell, like rain thickening and easing: two waves that never line up exactly.
    const t = i / SAMPLE_RATE;
    const swell =
      0.86 + 0.08 * Math.sin((2 * Math.PI * t) / 9.3) + 0.06 * Math.sin((2 * Math.PI * t) / 5.1 + 1);
    buffer[i] += high * swell;
  }
}

/**
 * One droplet: a few milliseconds of band-passed noise with a fast decay. Close drops get a soft
 * "plip" (a short sine that rises a little), far ones are only a tick in the bed.
 */
function renderDrop(buffer, random, { at, gain, centre, decay, plip }) {
  const start = Math.floor(at * SAMPLE_RATE);
  const length = Math.floor(decay * 6 * SAMPLE_RATE);
  // A band-pass biquad (RBJ cookbook, constant 0 dB peak): stable at any centre below Nyquist.
  const omega = (2 * Math.PI * centre) / SAMPLE_RATE;
  const alpha = Math.sin(omega) / (2 * 1.4);
  const a0 = 1 + alpha;
  const b0 = alpha / a0;
  const b2 = -alpha / a0;
  const a1 = (-2 * Math.cos(omega)) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  let phase = 0;
  for (let i = 0; i < length && start + i < buffer.length; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t / decay) * Math.min(1, t / 0.0008);
    const input = random() * 2 - 1;
    const band = b0 * input + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = band;
    let sample = band * gain * envelope;
    if (plip > 0) {
      const frequency = centre * 0.5 * (1 + 0.35 * Math.min(1, t / 0.012));
      phase += (2 * Math.PI * frequency) / SAMPLE_RATE;
      sample += Math.sin(phase) * plip * Math.exp(-t / (decay * 1.6)) * Math.min(1, t / 0.002);
    }
    buffer[start + i] += sample;
  }
}

function renderDrops(buffer, random, seconds) {
  // Far drops: many, faint. Near drops: few, a little brighter. Plips: rare and soft.
  const layers = [
    { perSecond: 60, gain: [0.03, 0.07], centre: [2400, 5200], decay: [0.002, 0.005], plipChance: 0 },
    { perSecond: 9, gain: [0.08, 0.16], centre: [1400, 3800], decay: [0.004, 0.009], plipChance: 0.18 },
  ];
  const between = (range) => range[0] + random() * (range[1] - range[0]);
  for (const layer of layers) {
    let at = 0;
    while (at < seconds) {
      // Exponential gaps: drops arrive at random like real rain, never on a grid.
      at += -Math.log(1 - random() * 0.999) / layer.perSecond;
      const plip = random() < layer.plipChance ? between([0.015, 0.04]) : 0;
      renderDrop(buffer, random, {
        at,
        gain: between(layer.gain),
        centre: between(layer.centre),
        decay: between(layer.decay),
        plip,
      });
    }
  }
}

/** Folds the tail into the head with an equal-power crossfade, so the loop has no seam. */
function closeLoop(buffer) {
  const loopLength = LOOP_SECONDS * SAMPLE_RATE;
  const seam = SEAM_SECONDS * SAMPLE_RATE;
  const out = new Float32Array(loopLength);
  for (let i = 0; i < loopLength; i++) {
    if (i < seam) {
      const progress = i / seam;
      const fadeIn = Math.sin((progress * Math.PI) / 2);
      const fadeOut = Math.cos((progress * Math.PI) / 2);
      out[i] = buffer[i] * fadeIn + buffer[loopLength + i] * fadeOut;
    } else {
      out[i] = buffer[i];
    }
  }
  return out;
}

function encodeWav(samples) {
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  const gain = peak > 0 ? PEAK / peak : 1;
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const out = Buffer.alloc(44 + dataSize);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + dataSize, 4);
  out.write('WAVE', 8);
  out.write('fmt ', 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SAMPLE_RATE, 24);
  out.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  out.writeUInt16LE(bytesPerSample, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const value = Math.max(-1, Math.min(1, samples[i] * gain));
    out.writeInt16LE(Math.round(value * 32767), 44 + i * bytesPerSample);
  }
  return out;
}

function main() {
  const seconds = LOOP_SECONDS + SEAM_SECONDS;
  const buffer = new Float32Array(seconds * SAMPLE_RATE);
  renderBed(buffer, createRandom(1709));
  renderDrops(buffer, createRandom(4421), seconds);
  const loop = closeLoop(buffer);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = join(OUTPUT_DIR, 'rain.wav');
  const wav = encodeWav(loop);
  writeFileSync(file, wav);
  // A build script: it reports what it wrote.
  // eslint-disable-next-line no-console
  console.log(`rain.wav  ${LOOP_SECONDS}s  ${(wav.length / 1024).toFixed(0)} KB  ${SAMPLE_RATE} Hz mono`);
}

main();
