/**
 * Fails if code that runs on the UI thread uses syntax the build turns into helper functions:
 * for...of loops, array destructuring and spread. Those helpers don't exist on the UI thread, so
 * the release app closes with "undefined is not a function" (it happened in dotsPath, 1 Nov).
 *
 * Checked: every function with a 'worklet' directive, and the callbacks given to
 * useAnimatedStyle, useAnimatedProps, useDerivedValue, useAnimatedReaction and gesture handlers
 * (.onBegin, .onStart, .onUpdate, .onChange, .onEnd, .onFinalize, .onTouches*).
 *
 * Also fails if a top-level 'worklet' function uses a top-level name declared below it in the same
 * file. The worklet build turns each worklet declaration into a const that captures what it uses at
 * that line, so a later name is captured as undefined (dotsPath calling popScale, 2 Nov).
 *
 * Usage: node scripts/check-worklets.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SRC = join(ROOT, 'src');
const STARTS = [
  /'worklet';/g,
  /\b(useAnimatedStyle|useAnimatedProps|useDerivedValue|useAnimatedReaction)\(/g,
  /\.(onBegin|onStart|onUpdate|onChange|onEnd|onFinalize|onTouchesDown|onTouchesMove|onTouchesUp)\(/g,
];
const BANNED = [
  { pattern: /\bfor\s*\([^)]*\bof\b/, name: 'for...of' },
  { pattern: /\b(const|let|var)\s*\[/, name: 'array destructuring' },
  { pattern: /\.\.\.[A-Za-z_$([{]/, name: 'spread' },
];

function collectFiles(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (name === '__tests__' || name === 'testing') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...collectFiles(path));
    else if (['.ts', '.tsx'].includes(extname(name))) files.push(path);
  }
  return files;
}

/** The text from `from` to the end of the first balanced brace block after it. */
function blockAfter(text, from) {
  const open = text.indexOf('{', from);
  if (open < 0) return '';
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    else if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(open, index + 1);
    }
  }
  return text.slice(open);
}

/** For a 'worklet' directive, the enclosing body starts just before it. */
function bodyFor(text, match, isDirective) {
  if (!isDirective) return blockAfter(text, match.index);
  const open = text.lastIndexOf('{', match.index);
  return blockAfter(text, open);
}

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

const TOP_LEVEL = /^(?:export\s+)?(?:async\s+)?(?:function\s+|const\s+|let\s+|class\s+)([A-Za-z_$][\w$]*)/gm;

/** Top-level worklet functions that use a top-level name declared further down the file. */
function lateCaptures(text, file) {
  const declared = [...text.matchAll(TOP_LEVEL)].map((match) => ({ name: match[1], index: match.index }));
  const found = [];
  for (const { name, index } of declared) {
    if (!/^(?:export\s+)?function\s/.test(text.slice(index, index + 40))) continue;
    const body = stripComments(blockAfter(text, index));
    if (!body.includes("'worklet'")) continue;
    for (const later of declared) {
      if (later.index <= index || later.name === name) continue;
      if (new RegExp(`(?<![\\w$.])${later.name.replace(/\$/g, '\\$')}(?![\\w$])`).test(body)) {
        const line = text.slice(0, index).split('\n').length;
        found.push(`${relative(ROOT, file)}:${line}: worklet ${name} uses ${later.name}, declared below it`);
      }
    }
  }
  return found;
}

const problems = [];
for (const file of collectFiles(SRC)) {
  const text = readFileSync(file, 'utf8');
  problems.push(...lateCaptures(text, file));
  STARTS.forEach((start, startIndex) => {
    for (const match of text.matchAll(start)) {
      const body = bodyFor(text, match, startIndex === 0);
      // Strip comments so explanations of the rule don't trip it.
      const code = stripComments(body);
      for (const { pattern, name } of BANNED) {
        if (pattern.test(code)) {
          const line = text.slice(0, match.index).split('\n').length;
          problems.push(`${relative(ROOT, file)}:${line}: ${name} in UI-thread code`);
        }
      }
    }
  });
}

if (problems.length > 0) {
  console.error(`UI-thread code uses syntax that crashes release builds:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('Worklets are clean.');
