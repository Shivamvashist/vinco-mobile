# Vinco conventions

The rules every change follows, so the codebase reads as if one person wrote it. Many are enforced by `npm run check` (lint, typecheck, em-dash scan, tests). The rest are on whoever writes the code, human or AI.

Related: [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) for theme usage, [v1-docs/BUILD-STEPS.md](v1-docs/BUILD-STEPS.md) for the plan, [../HISTORY.md](../HISTORY.md) for current state.

---

## 1. Working rules (non-negotiable)

1. **No git commands** unless the developer asks for that specific command. This includes read-only ones (`git status`, `git diff`, `git log`). Suggest a commit message at a checkpoint; the developer commits.
2. **No em-dashes anywhere**: code, comments, copy, docs, commit messages, chat replies. Use a comma, colon, full stop or brackets. `npm run check:dashes` scans the repo.
3. **Protect the core job.** The core job is: open the app, tick today's orders, seal the day, fast and reliably, offline. If a proposed change makes that slower, more complex or less reliable, stop and flag it before building it.
4. **Stay in scope.** While building a feature, no unrelated cleanup, refactoring or restyling. If you spot something worth fixing, note it in HISTORY.md under "Noticed, not done" and move on.
5. **Update [HISTORY.md](../HISTORY.md)** after every feature milestone: what changed, why, current state, what's next. Another AI model must be able to continue from it alone.
6. **Check edge cases and errors** on every change (see section 6), and run `npm run check` before calling anything done.
7. **Plan UI before building it** (see section 7). No generic placeholder components.
8. **Check the Expo docs for SDK 57** before using any Expo or React Native API (see [AGENTS.md](../AGENTS.md)). Install with `npx expo install`.

---

## 2. Naming

| Thing                            | Convention                                                           | Example                                               |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| Folders                          | kebab-case, lowercase                                                | `src/features/campaign/`, `src/components/day-card/`  |
| Route files in `src/app/`        | kebab-case, plus Expo Router names (`_layout`, `(group)`, `[param]`) | `(tabs)/veni.tsx`, `dev/theme-lab.tsx`                |
| React component files            | PascalCase, file name equals component name                          | `TaskRow.tsx` exports `TaskRow`                       |
| Hook files                       | camelCase starting with `use`                                        | `useToday.ts` exports `useToday`                      |
| Other modules                    | camelCase, named after the main export or the domain                 | `toRoman.ts`, `campaign.ts`, `soundBank.ts`           |
| Components                       | PascalCase                                                           | `ProgressRing`                                        |
| Props types                      | `<Component>Props`                                                   | `TaskRowProps`                                        |
| Types                            | PascalCase, `type` over `interface`, no `I` prefix                   | `TaskStatus`, `DayLog`                                |
| Functions and variables          | camelCase; functions start with a verb                               | `sealDay()`, `getRank()`, `campaignLength`            |
| Booleans                         | `is`, `has`, `should`, `can` prefix                                  | `isSealed`, `hasTruce`, `canRise`                     |
| Event props and handlers         | `onX` for props, `handleX` inside the component                      | `onPress={handlePress}`                               |
| Module-level constants           | SCREAMING_SNAKE_CASE                                                 | `MAX_NUDGES_PER_DAY`, `DEFAULT_THEME_ID`              |
| Token and config objects         | camelCase                                                            | `space.lg`, `motion.duration.base`                    |
| String unions (instead of enums) | camelCase literals                                                   | `type Tone = 'philosopher' \| 'centurion' \| 'roast'` |
| Test files                       | `__tests__/<module>.test.ts` next to the code                        | `src/features/campaign/__tests__/campaign.test.ts`    |
| SQLite tables and columns        | snake_case, tables plural                                            | `task_logs.full_target`                               |
| API paths (later)                | `/v1/` then kebab-case; JSON bodies camelCase                        | `POST /v1/step-one`                                   |
| Asset files                      | kebab-case; sound files are named exactly after their feedback cue   | `laurel-wreath.svg`, `stepUp.wav`                     |
| Copy keys                        | camelCase, grouped by screen                                         | `today.evenNudge.roast`                               |
| Env vars (later)                 | `EXPO_PUBLIC_` prefix only for values safe to ship                   | `EXPO_PUBLIC_API_URL`                                 |

Avoid abbreviations except well-known ones (`id`, `url`, `db`). Name things after the product vocabulary in code (`truce`, `campaign`, `orders`), and show the plain label next to the Latin word in the UI.

Lint enforces naming for functions, variables, parameters and types (`@typescript-eslint/naming-convention`).

---

## 3. Exports and imports

**Exports**

- **Named exports only.** Default exports are allowed only in `src/app/` route files, because Expo Router requires them. Lint enforces this.
- **One exported component per file.** Small sub-components used only in that file may live below it, unexported.
- **Exported functions get explicit return types** when they are part of a module's public API.
- **Folders that act as a module expose a public API through `index.ts`**: `src/theme`, `src/copy`, `src/db`, and each `src/features/<name>`. Other code imports from the folder, never from files inside it. Lint enforces this for `@/theme`.
- **Components have no barrel file.** Import each directly: `import { Txt } from '@/components/Txt'`. This keeps imports explicit and avoids circular imports.
- **Private helpers stay unexported**, at the bottom of the file under the main export. If a helper is needed in two places, move it to `src/lib/` and export it from there.

**Imports**

- `@/` points to `src/`, `@/assets/` points to `assets/`. Use relative imports only inside the same module folder.
- Order (Prettier keeps formatting, you keep order): external packages, blank line, `@/` imports, blank line, relative imports.
- Type-only imports use `type`: `import { type Theme } from '@/theme'`. Lint enforces this.

**File layout, top to bottom**

1. Imports
2. Types (props first)
3. Module constants
4. The main export
5. Private sub-components and helpers
6. `const useStyles = createStyles(...)` last

---

## 4. Folder structure

```
src/
  app/                 routes only (Expo Router). Thin: read state, call features, render components.
    _layout.tsx        fonts, splash, store-fed ThemeProvider, status bar
    index.tsx          entry redirect
    (tabs)/            Veni, Vidi, Vici and their custom tab bar layout
    onboarding/        Rubicon, arc, orders, tone, oath, selfie
    dev/               dev-only screens (theme lab: long-press the Vici tab)
  components/          shared UI, one component per file, no barrel
    navigation/        TabBar
    today/             TaskRow, WorkoutSheet, StampOverlay, SelfieTile, SealDayCard, TruceBanner, TodoTile
    orders/            AddOrderSheet
    proof/             WeightTile, WeightSheet
    tasks/             TaskItemRow, CarryOverCard, AddTaskSheet
    onboarding/        FlowLayout, QuoteCarousel, RiverLines, TypingPreview, OathRecorder
    progress/          StatTile, MonthCalendar, WeekBarChart, WeightChart, Commentarii
    arc/               ArcJourney, RankCard, SettingsRow, RetreatSheet
    campaign/          Column
    dayCard/           DayCard
  theme/               design system: tokens, palettes, themes, feedback (see DESIGN-SYSTEM.md)
  copy/                ALL user-facing text, one file per area, three tones where it varies
  config/              FEATURES: flags for built-but-off features
  features/<name>/     product logic as pure functions, each folder with an index.ts (tone; later orders, campaign...)
  stores/              Zustand app/UI state, persisted to the phone (preferences, onboarding draft, notices, dev mode)
  db/                  SQLite + Drizzle schema, migrations, queries   (Step 7)
  hooks/               shared React hooks (useToday, useTodayOrders, useActiveArc, useCampaign, useTasks, useOwnOrderActions, useCompleteOnboarding, useResetJourney)
  media/               photos and recordings in the app's private folder (never uploaded)
  lib/                 small generic pure helpers (dates, toRoman, progress), no barrel: import each file
  dev/                 dev-only UI (kit gallery, DevPanel, devActions). Real screens import only DevPanel, and only behind IS_DEV_MODE_AVAILABLE
  __tests__/           render tests that boot the real app from src/app
assets/
  fonts/ images/ sounds/<theme-id>/
scripts/               dev tools (sound generation, checks)
docs/                  plan, conventions, design system, references
jest.setup.ts          fakes for native modules, so any module can be imported in tests
```

**Where code goes**

- **Screens (`src/app/`) don't hold logic.** They call functions like `sealDay()` or `getCampaign()` from `src/features/`.
- **`src/features/` is pure TypeScript**: inputs in, outputs out. No React, no SQLite, no `Date.now()` inside (pass `now` in). This makes rules testable and easy to move to the server later.
- **`src/db/` does storage only.** Features never write SQL.
- **No hard-coded user-facing sentences in components.** They come from `src/copy/`. Dev-only screens are the only exception.
- **Components are presentational.** They take data through props; screens read stores and queries and pass values down.

**Database rules**

- Change the schema in `src/db/schema.ts`, then `npm run db:generate`. Never edit generated files in `src/db/migrations/`.
- Repository functions take `db: AppDatabase` as their first argument and are synchronous. They do storage only; rules live in `src/features/`.
- A user action that writes more than one row runs in `db.transaction`, reading fresh values inside it.
- Don't store what can be derived (an order's status, a campaign length). Store the facts it comes from.
- Screens read with `useLiveQuery`, wait for `updatedAt` before rendering rows, and show a calm message if a write fails.
- Tests use `createTestDatabase()` (real SQLite in memory with the real migrations), cleared before each test.

**Where state lives**

| Kind of state                                | Where                                                  | Example                                 |
| -------------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Records the user creates                     | SQLite through Drizzle, read with live queries         | tasks, day logs, selfies, ledger        |
| App and UI state that must survive a restart | Zustand store in `src/stores/`, persisted to the phone | tone, theme, sound, onboarding progress |
| Short-lived UI state                         | `useState` in the component                            | an open sheet, a text field             |
| Server data (from 1.0)                       | TanStack Query                                         | squads, rankings                        |

- **Never copy database records into Zustand.** Two copies drift apart. Live queries re-render screens when the data changes.
- **Every persisted store validates what it restores** (see `sanitizePreferences`), has a `version`, and handles old versions in `migrate`. A corrupted save must fall back to defaults, never crash.
- Read stores with a selector (`usePreferencesStore((s) => s.tone)`), and `useShallow` when selecting several fields, so components re-render only when what they use changes.

---

## 5. TypeScript and React

- Strict mode plus `noUncheckedIndexedAccess`: array and record lookups may be `undefined`, so handle it.
- No `any`. If a value is unknown, type it `unknown` and narrow it.
- Prefer string unions over enums, and `switch` with every case handled so TypeScript flags a missing one.
- Functional components and hooks only. The React Compiler is on, so don't add `useMemo`/`useCallback` by reflex; add them where identity matters (context values, effect dependencies).
- Effects clean up after themselves (timers, listeners, audio players).
- Text always through `Txt`, screens always through `Screen`, styles always through `createStyles`. See DESIGN-SYSTEM.md.

---

## 6. Edge cases and errors: the checklist

Run through this for every change. Write a test for each case that lives in pure logic.

**Data and state**

- Empty: no tasks, no history, first day, no selfie yet.
- Limits: zero, the maximum, one past the maximum, negative numbers, decimals (water in 0.5 L steps).
- Repeated actions: double taps, tapping after the goal is reached, tapping during an animation.
- Missing or corrupted stored data: fall back to a safe default, never crash.

**Time** (the core of a streak app)

- Midnight rollover while the app is open.
- App not opened for several days (seal the missed days on next open).
- Time zone change, daylight saving, phone clock moved backwards.
- The Truce window: a Truce covers only the missed run that ends yesterday, and only while today lasts.

**Device**

- Permission denied, or revoked later: show the reason and a way forward.
- Font size set to largest: text wraps, nothing overlaps (Txt caps the scale per style).
- Small screens (360 wide) and tall screens; the notch and gesture bar (Screen handles safe areas).
- Phone on silent: UI sounds stay quiet. No vibration motor: haptics fail silently.
- App sent to background mid-recording or mid-animation.

**Failures**

- Anything optional (sound, haptics, analytics later) fails quietly with a `__DEV__` warning. It never blocks the core job.
- Anything essential (saving a tick, sealing a day) surfaces an error the user can act on and keeps their data.
- Never swallow an error silently in essential paths. Never show a raw error message to the user.

**Before calling it done:** `npm run check` passes (including the render tests, which mount every route), and the change has been tried on the phone in Expo Go.

**Motion:** read `useReduceMotion()` from `@/theme` (never Reanimated's hook) and jump to the end state when it is true. Never animate on first render unless the design calls for an entrance.

---

## 7. Building UI: plan, then build

No generic components. Every component is planned against the prototype before code is written.

1. **Find it in the prototype** (`docs/v1-reference/Vinco app UI.html`, 18 screens) and list every place it appears.
2. **Write a short spec** (in the PR, the task, or HISTORY.md):
   - purpose in one line
   - props, with types and defaults
   - variants and states: default, pressed, selected, disabled, loading, empty, error
   - tokens it uses (colour roles, type variants, spacing)
   - feedback cue and haptic on interaction
   - accessibility: role, label, state, 44 by 44 touch target
   - motion, if any, with reduced-motion behaviour
3. **Build it** with theme tokens only, then add it to the theme lab (`src/app/dev/theme-lab.tsx`) in every state.
4. **Verify it doesn't break**: both colour schemes, largest font size, smallest screen, rapid taps, long text in every language field.

---

## 8. Formatting and tooling

| Command             | Does                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `npm run check`     | typecheck, lint, em-dash scan, tests. Run before every checkpoint |
| `npm run typecheck` | `tsc --noEmit`                                                    |
| `npm run lint`      | ESLint (Expo config, Prettier, project rules)                     |
| `npm run format`    | Prettier writes formatting                                        |
| `npm run test`      | Jest unit tests                                                   |
| `npm run sounds`    | Regenerates the UI sound files                                    |

Prettier settings live in `.prettierrc`: single quotes, trailing commas, 110 columns.
