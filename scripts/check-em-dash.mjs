/**
 * Fails if any project text file contains an em-dash (project rule: no em-dashes anywhere).
 * ESLint covers code strings; this also covers Markdown, JSON and config files.
 *
 * Usage: node scripts/check-em-dash.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const EM_DASH = String.fromCharCode(0x2014);
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.txt',
  '.yml',
  '.yaml',
]);
// Generated files, dependencies and the original design references are not ours to edit.
const SKIP = new Set([
  'node_modules',
  '.expo',
  '.git',
  'dist',
  'android',
  'ios',
  'package-lock.json',
  'v1-reference',
]);

function collectFiles(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...collectFiles(path));
    else if (TEXT_EXTENSIONS.has(extname(name))) files.push(path);
  }
  return files;
}

const hits = [];
for (const file of collectFiles(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (line.includes(EM_DASH)) hits.push(`${relative(ROOT, file)}:${index + 1}: ${line.trim()}`);
  });
}

if (hits.length > 0) {
  console.error(`Found ${hits.length} em-dash(es). Use a comma, colon, full stop or brackets instead:\n`);
  console.error(hits.join('\n'));
  process.exit(1);
}
console.log('No em-dashes found.');
