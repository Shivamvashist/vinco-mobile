# CLAUDE.md: Vinco mobile

Read this before every task. Then read [HISTORY.md](../HISTORY.md) for the current state.

| Doc                                                           | What's in it                                                                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [HISTORY.md](../HISTORY.md)                                   | Current state, architecture, decisions, milestone log. **Update after every milestone** |
| [docs/CONVENTIONS.md](../docs/CONVENTIONS.md)                 | Naming, exports, folders, edge-case checklist, UI process. **Follow it**                |
| [docs/DESIGN-SYSTEM.md](../docs/DESIGN-SYSTEM.md)             | Theme, colour roles, type, sounds, haptics, adding a theme                              |
| [docs/v1-docs/BUILD-STEPS.md](../docs/v1-docs/BUILD-STEPS.md) | The step-by-step plan and what's next                                                   |
| [docs/v1-docs/PLAN.md](../docs/v1-docs/PLAN.md)               | Full product plan                                                                       |
| `docs/v1-reference/Vinco app UI.html`                         | Clickable prototype of all 18 screens: exact layouts, copy, motion and sounds           |

## Working rules (non-negotiable)

1. **No git commands** of any kind (not even `git status` or `git diff`) unless the developer asks for that specific command. Suggest commit messages; the developer commits.
2. **No em-dashes anywhere**: code, comments, copy, docs, and replies to the developer. Use commas, colons, full stops or brackets.
3. **Protect the core job** (open, tick today's orders, seal the day: fast, reliable, offline). If a change makes it slower, more complex or less reliable, stop and flag it first.
4. **Stay in scope.** No unrelated cleanup, refactoring or restyling while on a feature. Note it in HISTORY.md under "Noticed, not done".
5. **Update HISTORY.md** after every feature milestone, so a different AI model can pick up from it alone.
6. **Check edge cases and errors** on every change (CONVENTIONS section 6). Run `npm run check` before calling work done.
7. **Plan UI before building** against the prototype (CONVENTIONS section 7). No generic components.
8. **Follow the naming and export conventions** (CONVENTIONS sections 2 and 3). Lint enforces most of them.
9. **Check the Expo SDK 57 docs** before using an Expo or React Native API (see [AGENTS.md](../AGENTS.md)). Install with `npx expo install <pkg>`.

## What Vinco is

**One line:** Vinco uses your phone to beat your phone.

Vinco is an Android app for people running a 30, 60 or 90 day "arc." Every day the user completes four non-negotiable orders (water, wake-up, a protein meal, a workout), takes a selfie as proof, and sees their progress fill in. Later, the Vigil counts every reel and short they watch, shows it live in a floating badge, and steps in at milestones. The theme is Roman and Stoic, the look is modern, and the voice can be calm, firm or sarcastic.

Tagline: **Veni, vidi, vici.** The three words are the app's three tabs: Veni (Today), Vidi (Progress), Vici (Arc).

## The developer

- Experienced with React and web; **new to React Native and Android**. When introducing a mobile-specific concept (safe areas, permissions, native modules, builds, background behaviour), explain it briefly in plain words.
- Works on **Windows, PowerShell**. Give PowerShell-friendly commands.
- Tests on a **real Android phone via Expo Go**.

## Current phase

**Early Access build (tracker only).** First build to Play closed testing by **12 October 2026**; public Early Access on **2 November 2026**.

- Everything runs **on the phone**. **No backend yet.** No API calls, auth or server.
- The Vigil, Aurora alarm missions, squads, AI and the denarii shop come in Vinco 1.0 (1 January 2027). Don't build them unless asked.
- See BUILD-STEPS.md for what's done and next.

## Stack

| Area            | Choice                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Framework       | React Native with **Expo SDK 57**, TypeScript strict (+ `noUncheckedIndexedAccess`), React Compiler on |
| Navigation      | **Expo Router**, routes in **`src/app/`**                                                              |
| Package manager | **npm** (not pnpm). Expo and RN packages via `npx expo install`                                        |
| Local database  | `expo-sqlite` (from Step 7)                                                                            |
| State           | React state and hooks first; Zustand if shared state gets messy                                        |
| Sound, haptics  | `expo-audio`, `expo-haptics`, through `useFeedback()` only                                             |
| Notifications   | `expo-notifications`, local only                                                                       |
| Fonts           | Marcellus (display), Figtree (body), loaded per weight from `@expo-google-fonts/*` subpaths            |
| Quality         | ESLint (Expo + Prettier + project rules), Prettier, Jest (`jest-expo`)                                 |
| Runtime         | Expo Go for now. Development builds only when custom native code is needed (Vigil, Nov)                |

Two repos: `vinco-mobile` (this one) and `vinco-api` (later: Hono, OpenAPI spec as the contract, all endpoints under `/v1/`).

## Code rules (short version; details in CONVENTIONS.md)

- **Text:** always `Txt` (`@/components/Txt`), never raw `<Text>`. Text styles don't cascade in React Native.
- **Screens:** always wrapped in `Screen` (`@/components/Screen`) for safe area and background.
- **Styles:** `createStyles((theme) => ...)` from `@/theme`. Colour **roles** only (`theme.colors.accent`), never hex. Spacing, radius and sizes from tokens.
- **Fonts:** pick weight by family (`theme.fonts.bodySemiBold`), never `fontWeight`.
- **Feedback:** `useFeedback()` then `play('tap')`. Never play audio files directly.
- **Copy:** all user-facing text in `src/copy/`, keyed by tone where it varies.
- **Logic:** pure functions in `src/features/`; screens call them. Storage in `src/db/`.
- **Exports:** named only; default exports only in `src/app/` routes.
- Touch targets at least 44 by 44. No secrets in the repo or the app.

## Design system (summary)

Dark (Basalt) by default, light (Marble) available, both from the one Vinco core theme. Roman in spirit, modern in use: every Latin word sits beside a plain label. Full detail in DESIGN-SYSTEM.md.

| Role                      | Basalt                | Brand meaning                                 |
| ------------------------- | --------------------- | --------------------------------------------- |
| `background`              | `#1D1A17`             | Basalt                                        |
| `surface` / `surfaceSunk` | `#26221E` / `#211E1A` | Cards / inset rows                            |
| `border`                  | `#3B352E`             | Lines                                         |
| `text` / `textMuted`      | `#ECE5D8` / `#A99F90` | Marble                                        |
| `accent`                  | `#D2AC55`             | Laurel gold: wins, full goal, primary buttons |
| `danger`                  | `#D0697D`             | Porphyry: warnings, reel counter              |
| `currency`                | `#C9C6BF`             | Silver: denarii only                          |

- **Display font** (Marcellus) for big moments only; **body** (Figtree) for everything else.
- **Roman numerals are decoration only:** a small "DAY XII OF LX" above a big "12."
- **Signature moment:** the VINCO stamp slams onto the day when all orders hold, with the `stamp` sound and a heavy haptic. Everything else is quick and quiet.

### Vocabulary (Roman name and plain label)

Cross the Rubicon (Begin your arc), Campaign (days in a row), Hold the line (minimum), Conquer (full goal), Truce (rest day), Resurgo (comeback), Aurora (alarm), the Vigil (reel counter), Contubernium (squad), the Armory (task ideas), the Senate report (weekly review), Denarii (coins), the Forum (shop), Tributum (over-budget fee), Decorations (achievements). Ranks: Tiro, Miles, Optio, Centurion, Tribune, Legate, Consul, Caesar.

## Product rules (don't break these)

- **Every task has a minimum and a full goal.** Hitting the minimum keeps the campaign alive.
- **One free Truce per week** protects the campaign on a missed day.
- **Three tones:** Philosopher (calm Stoic), Centurion (firm coach), Roast me (sarcastic). Every notification and empty state is written all three ways.
- **Humour rule:** roast the habit, the phone and the excuse, never the person. Selfie, weight and slip screens stay neutral in every tone. Every sarcastic line ends with a way forward.
- **At most three nudges a day**, plus the alarm.
- **Selfies never leave the phone.**
- **Denarii, ranks and decorations are earned, never sold for real money.**
- The app is for adults (18+).

## Commands (PowerShell)

```powershell
npx expo start            # run in Expo Go (scan the QR code)
npx expo start --tunnel   # if the phone can't connect over Wi-Fi
npx expo start -c         # clear the cache after config or asset changes
npx expo install <pkg>    # add an Expo/RN package
npm run check             # typecheck + lint + em-dash scan + tests (before every checkpoint)
npm run format            # Prettier
npm run sounds            # regenerate UI sounds after editing scripts/generate-sounds.mjs
```
