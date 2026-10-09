/**
 * Builds every app icon file from one source image: npm run icons.
 *
 * The source (assets/app-icon/vinco_dark_v1.png) is a finished icon tile: a light mark on a
 * dark rounded square. Android cuts icons into the phone's own shape from two layers, so the
 * mark is lifted off the tile (by brightness) and placed on its own:
 *
 *   assets/images/android-icon-foreground.png  mark on transparent, inside Android's safe circle
 *   assets/images/android-icon-monochrome.png  white mark, for themed icons (Android 13+)
 *   assets/images/icon.png                     full-bleed square: tile colour plus mark (Play Store, legacy)
 *   assets/images/splash-icon.png              mark alone, trimmed, for the splash screen
 *   assets/images/favicon.png                  small square, for web
 *
 * The tile colour is printed at the end: it is app.json's adaptive icon backgroundColor.
 * Re-run after replacing the source image. Uses pngjs only (already installed with Expo).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pngjs from 'pngjs';

const { PNG } = pngjs;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'assets/app-icon/vinco_dark_v1.png');
const OUT = path.join(ROOT, 'assets/images');

const SIZE = 1024;
/** Ignore this share of each edge: the tile's rounded border, outer glow and transparent corners. */
const EDGE_INSET = 0.09;
/**
 * Brightness ramp for lifting the mark: below LOW is tile, above HIGH is mark, between is the
 * soft edge. Set in the gap of the source's brightness histogram (tile and glow under ~120,
 * paper mark over ~160), so the paper's own shading stays solid.
 */
const LOW = 120;
const HIGH = 160;
/** Shapes smaller than this share of the largest are specks or glow, not the mark. */
const MIN_SHAPE_SHARE = 0.05;
/** Mark size, as its bounding box diagonal over the canvas side. Android's safe circle is 66%. */
const FOREGROUND_DIAGONAL = 0.6;
const ICON_DIAGONAL = 0.7;

const source = PNG.sync.read(fs.readFileSync(SOURCE));
const { width: W, height: H } = source;

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const at = (x, y) => (y * W + x) * 4;

// 1. Alpha of the mark per source pixel, then only its large shapes, then its bounding box.
const alpha = new Float32Array(W * H);
const x0 = Math.floor(W * EDGE_INSET);
const x1 = Math.ceil(W * (1 - EDGE_INSET));
const y0 = Math.floor(H * EDGE_INSET);
const y1 = Math.ceil(H * (1 - EDGE_INSET));
let markR = 0;
let markG = 0;
let markB = 0;
let markCount = 0;
let tileR = 0;
let tileG = 0;
let tileB = 0;
let tileCount = 0;

for (let y = y0; y < y1; y += 1) {
  for (let x = x0; x < x1; x += 1) {
    const i = at(x, y);
    const [r, g, b, a] = [source.data[i], source.data[i + 1], source.data[i + 2], source.data[i + 3]];
    if (a < 255) continue;
    const l = luminance(r, g, b);
    const value = Math.min(1, Math.max(0, (l - LOW) / (HIGH - LOW)));
    alpha[y * W + x] = value;
    if (value === 1) {
      markR += r;
      markG += g;
      markB += b;
      markCount += 1;
    } else if (l < 40) {
      tileR += r;
      tileG += g;
      tileB += b;
      tileCount += 1;
    }
  }
}

// Label connected shapes (4-neighbour flood fill) and clear the small ones.
const shapeOf = new Int32Array(W * H).fill(-1);
const shapeSizes = [];
for (let start = 0; start < W * H; start += 1) {
  if (alpha[start] === 0 || shapeOf[start] !== -1) continue;
  const id = shapeSizes.length;
  const stack = [start];
  shapeOf[start] = id;
  let size = 0;
  while (stack.length > 0) {
    const index = stack.pop();
    size += 1;
    const x = index % W;
    const neighbours = [index - W, index + W, x > 0 ? index - 1 : -1, x < W - 1 ? index + 1 : -1];
    for (const next of neighbours) {
      if (next >= 0 && next < W * H && alpha[next] > 0 && shapeOf[next] === -1) {
        shapeOf[next] = id;
        stack.push(next);
      }
    }
  }
  shapeSizes.push(size);
}
const largestShape = Math.max(0, ...shapeSizes);
let minX = W;
let minY = H;
let maxX = -1;
let maxY = -1;
for (let index = 0; index < W * H; index += 1) {
  if (alpha[index] === 0) continue;
  if (shapeSizes[shapeOf[index]] < largestShape * MIN_SHAPE_SHARE) {
    alpha[index] = 0;
    continue;
  }
  const x = index % W;
  const y = Math.floor(index / W);
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
  minY = Math.min(minY, y);
  maxY = Math.max(maxY, y);
}

if (maxX < 0 || markCount === 0 || tileCount === 0) {
  throw new Error('Could not find a light mark on a dark tile in the source image.');
}

const markColor = [markR / markCount, markG / markCount, markB / markCount].map(Math.round);
const tileColor = [tileR / tileCount, tileG / tileCount, tileB / tileCount].map(Math.round);
const boxW = maxX - minX + 1;
const boxH = maxY - minY + 1;

/** Bilinear sample of the source at a fractional point: [r, g, b, alpha]. */
function sample(sx, sy) {
  const fx = Math.min(Math.max(sx, 0), W - 1.001);
  const fy = Math.min(Math.max(sy, 0), H - 1.001);
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const tx = fx - ix;
  const ty = fy - iy;
  const out = [0, 0, 0, 0];
  for (const [dx, dy, weight] of [
    [0, 0, (1 - tx) * (1 - ty)],
    [1, 0, tx * (1 - ty)],
    [0, 1, (1 - tx) * ty],
    [1, 1, tx * ty],
  ]) {
    const x = ix + dx;
    const y = iy + dy;
    const i = at(x, y);
    const a = alpha[y * W + x];
    out[0] += source.data[i] * weight * a;
    out[1] += source.data[i + 1] * weight * a;
    out[2] += source.data[i + 2] * weight * a;
    out[3] += a * weight;
  }
  if (out[3] > 0) for (let c = 0; c < 3; c += 1) out[c] /= out[3];
  return out;
}

/**
 * Draws the mark centred on a canvas. Soft edge pixels take the mark's average colour,
 * so no dark fringe from the old tile survives.
 * @param scale canvas pixels per source pixel
 * @param options background (rgb or null for transparent), white (monochrome)
 */
function render(canvasW, canvasH, scale, { background = null, white = false } = {}) {
  const png = new PNG({ width: canvasW, height: canvasH });
  const offsetX = (canvasW - boxW * scale) / 2;
  const offsetY = (canvasH - boxH * scale) / 2;
  for (let y = 0; y < canvasH; y += 1) {
    for (let x = 0; x < canvasW; x += 1) {
      const sx = minX + (x + 0.5 - offsetX) / scale - 0.5;
      const sy = minY + (y + 0.5 - offsetY) / scale - 0.5;
      const inBox = sx >= minX - 1 && sx <= maxX + 1 && sy >= minY - 1 && sy <= maxY + 1;
      const [r, g, b, a] = inBox ? sample(sx, sy) : [0, 0, 0, 0];
      const colour = white ? [255, 255, 255] : a < 1 ? markColor : [r, g, b];
      const i = (y * canvasW + x) * 4;
      if (background) {
        for (let c = 0; c < 3; c += 1) png.data[i + c] = Math.round(colour[c] * a + background[c] * (1 - a));
        png.data[i + 3] = 255;
      } else {
        png.data[i] = Math.round(colour[0]);
        png.data[i + 1] = Math.round(colour[1]);
        png.data[i + 2] = Math.round(colour[2]);
        png.data[i + 3] = Math.round(a * 255);
      }
    }
  }
  return png;
}

function write(name, png) {
  fs.writeFileSync(path.join(OUT, name), PNG.sync.write(png));
  console.log(`  ${name} (${png.width}x${png.height})`);
}

/** The scale that makes the mark's diagonal this share of a square canvas side. */
const byDiagonal = (share, side) => (share * side) / Math.hypot(boxW, boxH);

const hex = (rgb) =>
  `#${rgb
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

console.log(`Source ${W}x${H}, mark ${boxW}x${boxH}`);
const foregroundScale = byDiagonal(FOREGROUND_DIAGONAL, SIZE);
write('android-icon-foreground.png', render(SIZE, SIZE, foregroundScale));
write('android-icon-monochrome.png', render(SIZE, SIZE, foregroundScale, { white: true }));
write('icon.png', render(SIZE, SIZE, byDiagonal(ICON_DIAGONAL, SIZE), { background: tileColor }));
// The splash mark fills its own trimmed canvas; app.json's imageWidth sets its size on screen.
const SPLASH_WIDTH = 512;
const splashScale = SPLASH_WIDTH / boxW;
write('splash-icon.png', render(SPLASH_WIDTH, Math.round(boxH * splashScale), splashScale));
write('favicon.png', render(48, 48, byDiagonal(ICON_DIAGONAL, 48), { background: tileColor }));
console.log(`Tile colour (app.json adaptiveIcon.backgroundColor): ${hex(tileColor)}`);
