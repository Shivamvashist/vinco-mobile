# HISTORY.md: Vinco mobile project state

The memory of this project. Any AI model or developer joining should read this, then [.claude/CLAUDE.md](.claude/CLAUDE.md), and be able to continue. **Update after every feature milestone** (newest log entry on top; refresh the snapshot).

---

## Snapshot (as of 9 Oct 2026)

**Phase:** Early Access (tracker only, all on the phone, no backend). Closed-test build due **12 Oct 2026**, Early Access **2 Nov 2026**.

**Done:** Step 1 (project setup), Step 2 (foundation: rules, tooling, design system).

**Next:** Step 3, app shell and navigation (copy system, `toRoman` and date helpers, Veni/Vidi/Vici tabs). Then Step 4 (UI kit), Step 5 (Today screen), Step 6 (first Play build). See [docs/v1-docs/BUILD-STEPS.md](docs/v1-docs/BUILD-STEPS.md).

**What runs today:** opening the app redirects to the dev-only theme lab (`/dev/theme-lab`), which shows every text style, every colour role, plays every sound/haptic cue, and switches dark, light and system colour modes.

### Architecture

- Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6 strict (+ `noUncheckedIndexedAccess`), React Compiler on, Expo Router with routes in `src/app/`.
- Path aliases: `@/` = `src/`, `@/assets/` = `assets/` (the more specific alias must stay first in `tsconfig.json`, or Jest and Metro resolve assets into `src/`).
- **Theme (`src/theme/`)**: a core theme (`ThemeDefinition`) = dark scheme + light scheme + fonts + feedback set. `ThemeProvider` resolves user `ThemePreferences` (themeId, colorMode, soundEnabled, hapticsEnabled) into the `Theme` read by `useTheme()`. Styles via `createStyles`. Colour **roles** (accent, danger, rest ...) rather than brand names. Only theme: `vinco` (Basalt dark, Marble light). Public API is `@/theme` only.
- **Feedback**: `useFeedback()` returns `play(cue)`. 17 cues (tap, select, toggle, stepUp, stepDown, win, stamp, cross, chime, confirm, recordStart, recordStop, shutter, seal, rise, truce, denied). WAVs in `assets/sounds/vinco/` are rendered by `scripts/generate-sounds.mjs` from the prototype's WebAudio recipes. Players are preloaded per theme and released on theme change. Sounds mix with other audio and are muted when the phone is on silent.
- **Components**: `Txt` (themed text, per-variant font-scale cap) and `Screen` (safe area, gutters, scroll). More in Step 4.
- **Root layout**: loads fonts for all registered themes behind the splash; if fonts fail it continues with system fonts rather than hanging.
- **Quality gates**: `npm run check` = `tsc` + ESLint + em-dash scan + Jest. Custom lint rules: no raw `Text`, no colour literals outside `src/theme/`, no em-dashes in strings, named exports only (except routes), naming conventions, `@/theme` imports only.

### Key decisions

| Date  | Decision                                                     | Why                                                                                        |
| ----- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 9 Oct | Colour tokens named by role, not brand (`accent` not `gold`) | Switching core themes must not leave misleading names                                      |
| 9 Oct | Light scheme (Marble) built now, dark stays default          | Theme switching is a stated requirement; contrast tests keep both readable                 |
| 9 Oct | `app.json` `userInterfaceStyle` stays `automatic`            | Lets `colorMode: 'system'` work; the app's own default is still dark                       |
| 9 Oct | Sounds generated as WAV from the prototype recipes           | Matches the design exactly; a new theme can ship its own set                               |
| 9 Oct | Fonts imported per weight from subpaths                      | Package index would bundle all 14 Figtree weights                                          |
| 9 Oct | Android package name **not** set yet                         | It becomes permanent on first Play upload; decide in Step 6                                |
| 9 Oct | Theme preferences not persisted yet                          | Persistence arrives with SQLite in Step 7 via `initialPreferences` / `onPreferencesChange` |
| 9 Oct | Play closed-test build moved to Step 6 (before the database) | The 14-day closed test must start by 12 Oct to make 2 Nov                                  |

### Open decisions (for the developer)

- Studio name and Android package name (before the first Play upload, Step 6).
- Play Console account: new personal (needs 12+ testers for 14 days) or an older one.
- App icon and splash art (current images are the Expo template's).
- Where "wake and sleep times" and "step one" sit in onboarding: the prototype's indicator shows five steps (arc, orders, tone, oath, selfie), the plan lists more.
- Rank thresholds and earn rates (tune with Early Access data).

### Noticed, not done

- Template leftovers not used by the app: `assets/images/react-logo*.png`, `expo-badge*.png`, `expo-logo.png`, `logo-glow.png`, `tutorial-web.png`, `tabIcons/`; packages `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `expo-device`. Remove when convenient (`expo-device` may be useful later).
- `npm audit` reports 30 advisories in the dependency tree (mostly dev tooling). Review before the production build.
- `README.md` is now a short project readme.

---

## Milestone log

### 9 Oct 2026: Step 2, foundation

- Wrote the rules: `.claude/CLAUDE.md` (rewritten, paths fixed to `src/app/` and `docs/v1-docs/`), `AGENTS.md` (points every agent to the same rules), `docs/CONVENTIONS.md`, `docs/DESIGN-SYSTEM.md`, this file. Rewrote `docs/v1-docs/BUILD-STEPS.md` into 15 detailed steps with a dated timeline.
- Installed: `@expo-google-fonts/marcellus`, `@expo-google-fonts/figtree`, `expo-haptics`, `expo-audio` (adds its config plugin); dev: `eslint`, `eslint-config-expo`, `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`, `jest`, `jest-expo`, `@types/jest`.
- Config: `eslint.config.js`, `.prettierrc`, `.prettierignore`, Jest preset in `package.json`, scripts (`check`, `typecheck`, `test`, `format`, `check:dashes`, `sounds`), removed the broken `reset-project` script, `tsconfig.json` (`noUncheckedIndexedAccess`, `types: ["jest"]` because TS 6 no longer auto-includes global types, alias order fixed).
- `app.json`: name Vinco, slug and scheme `vinco`, basalt (`#1D1A17`) splash, icon and root backgrounds.
- Built `src/theme/` (tokens, palettes, Vinco theme, registry, resolver, provider, feedback, contrast helper), `src/components/Txt.tsx`, `src/components/Screen.tsx`, `src/app/_layout.tsx`, `src/app/index.tsx` (temporary redirect), `src/app/dev/theme-lab.tsx`.
- Scripts: `scripts/generate-sounds.mjs`, `scripts/check-em-dash.mjs`.
- Verified: 37 tests pass (contrast in both schemes, theme completeness, resolver edge cases); typecheck and lint clean; lint rules proven on a deliberately bad file; Android export bundles with all 17 sounds and only the 5 used font weights.
- Not yet verified on the phone: run `npx expo start -c` and open the theme lab.
