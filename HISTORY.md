# HISTORY.md: Vinco mobile project state

The memory of this project. Any AI model or developer joining should read this, then [.claude/CLAUDE.md](.claude/CLAUDE.md), and be able to continue. **Update after every feature milestone** (newest log entry on top; refresh the snapshot).

---

## Snapshot (as of 14 Oct 2026)

**Version:** 1.1.0 in progress (Wave 3); 1.0.0 is the baseline up to 12 Oct. Every change is logged in [docs/releases/](docs/releases/README.md).

**Phase:** Early Access (tracker only, all on the phone, no backend). Closed-test build due **12 Oct 2026**, Early Access **2 Nov 2026**.

**Done:** Steps 1 to 5 and 7 to 11, most of 12 and 13, and **Wave 2** ([docs/docs-v1.0.0/WAVE-2.md](docs/docs-v1.0.0/WAVE-2.md), archived): the Ludus (open training), own orders and to-dos switched on with one "How often?" sheet, the Forum and the Aerarium on the local ledger, a fourth tab (Castra, Settings), Vici rebuilt (record, treasury, decorations, past arcs, what next), quieter tab sound with the seal and stamp always on, layouts that fit every phone, the guard levels and Aurora in preview with native bridges, and the backend plan ([docs/BACKEND-PLAN.md](docs/BACKEND-PLAN.md)).

**Wave 3 (13 to 14 Oct, [docs/TASKS-2026-10-13.md](docs/TASKS-2026-10-13.md)):** onboarding starts from your own orders (free training) with a ready-made campaign as the second choice; a clean Today (user menu, quick logs for selfie, weight and calories, done orders sink, a run nudge in free training); Settings, permissions and the oath (twice a day) in the user menu, three tabs; to-dos carry over by themselves; Vidi's weight chart gains calories, and every calendar day opens a summary; sizes follow the phone's width; sounds off by default.

**Next:** try Wave 3 on the phone; local reminders with `expo-notifications`; the native parts (development build, Aurora then the Vigil: [docs/GUARDIANS.md](docs/GUARDIANS.md)), local nudges with the three-a-day cap and step one (Step 12), hardening (Step 14). Step 6 (first Play build) is blocked on the Play account. Before any backend: UUIDs, `updated_at`, `deleted_at` and an outbox on the synced tables (BACKEND-PLAN section 8).

**What runs today:** first launch opens onboarding (Rubicon; **your daily orders**: suggested water and workout plus your own, then tone, oath, first selfie; or "Choose a ready-made campaign": 30, 60 or 90 days, Vinco's four tuned, then the same steps). Three tabs: **Veni** (user button and menu, chips, quick logs, dawn card and wake sheet, orders with done ones sinking, a water suggestion when there are none, seal card and VINCO stamp on a conquered day, the to-do), **Vidi** (stats, calendar with a day summary on tap, Commentarii with weight and calories), **Vici** (the arc or free training, rank, record, treasury, decorations, every selfie, past arcs). Stack screens: `/settings` (Castra), `/permissions`, `/forum`, `/plan`, `/guard`, `/aurora`, `/selfie`, `/timelapse`, `/day-card`, `/campaign-lost`. A broken campaign opens the campaign-lost screen once; the Ludus never does.

### Architecture

- Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6 strict (+ `noUncheckedIndexedAccess`), React Compiler on, Expo Router with routes in `src/app/`.
- Path aliases: `@/` = `src/`, `@/assets/` = `assets/` (the more specific alias must stay first in `tsconfig.json`, or Jest and Metro resolve assets into `src/`).
- **Theme (`src/theme/`)**: a core theme (`ThemeDefinition`) = dark scheme + light scheme + fonts + feedback set. `ThemeProvider` resolves user `ThemePreferences` (themeId, colorMode, soundEnabled, hapticsEnabled) into the `Theme` read by `useTheme()`. Styles via `createStyles`. Colour **roles** (accent, danger, rest ...) rather than brand names. Only theme: `vinco` (Basalt dark, Marble light). Public API is `@/theme` only.
- **Feedback**: `useFeedback()` returns `play(cue)`. 17 cues (tap, select, toggle, stepUp, stepDown, win, stamp, cross, chime, confirm, recordStart, recordStop, shutter, seal, rise, truce, denied). WAVs in `assets/sounds/vinco/` are rendered by `scripts/generate-sounds.mjs` from the prototype's WebAudio recipes. Players are preloaded per theme and released on theme change. Sounds mix with other audio and are muted when the phone is on silent.
- **State**: Zustand for app/UI state in `src/stores/`, persisted with expo-sqlite's kv-store through a synchronous adapter (restored before first render). `usePreferencesStore` holds tone, themeId, colorMode, soundEnabled, hapticsEnabled; every restore is validated by `sanitizePreferences` (unknown theme ids, bad values and corrupted JSON fall back to defaults). Records will live in SQLite with Drizzle live queries (Step 7) and are never copied into Zustand. TanStack Query from 1.0.
- **ThemeProvider is controlled**: the root layout passes `preferences` from the store and `onPreferencesChange` back to it.
- **Copy (`src/copy/`)**: one file per area; `ToneLines` (`Record<Tone, string>`) + `pickTone`. `Tone` lives in `src/features/tone/`.
- **Dates (`src/lib/dates.ts`)**: everything is a local calendar day key ('YYYY-MM-DD'); maths uses UTC midnights of those dates so daylight saving can't shift a day. `useToday()` updates at midnight and when the app returns to the foreground.
- **Navigation**: Expo Router JS tabs (`expo-router` `Tabs`, types from `expo-router/js-tabs`; React Navigation is vendored inside Expo Router 57) with a custom `TabBar`.
- **Components**: `Txt`, `Screen`, `ScreenHeader`, `Card`, `ToneLine`, `navigation/TabBar`, and the Step 4 kit (`Icon`, `Laurel`, `StampMark`, `Button`, `IconButton`, `StatChip`, `ChoiceChip`, `SectionHeader`, `ProgressBar`, `ProgressRing`, `StatusCircle`, `OptionCard`, `Stepper`, `BottomSheet`). Specs in [docs/UI-KIT.md](docs/UI-KIT.md).
- **Motion**: Reanimated 4. `useReduceMotion()` from `@/theme` (one AccessibilityInfo listener in ThemeProvider); `themeTiming` / `themeEasing` map motion tokens. Unmount-after-exit uses `scheduleOnRN` from `react-native-worklets`.
- **Tests**: `jest.setup.ts` fakes expo-audio, expo-haptics, the kv-store, and uses the official Reanimated and worklets mocks. `src/__tests__/routes.test.tsx` boots the real app with `expo-router/testing-library` (needs `@testing-library/react-native` **v13** + `react-test-renderer` 19.2.3: v14 made `render` async and breaks `renderRouter`). Expo Router 57 needs `standard-navigation` in Jest's transform allowlist.
- **Root layout**: loads fonts for all registered themes behind the splash; if fonts fail it continues with system fonts rather than hanging.
- **Quality gates**: `npm run check` = `tsc` + ESLint + em-dash scan + Jest. Custom lint rules: no raw `Text`, no colour literals outside `src/theme/`, no em-dashes in strings, named exports only (except routes), naming conventions, `@/theme` imports only.

### Key decisions

| Date   | Decision                                                                                                                        | Why                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 9 Oct  | Colour tokens named by role, not brand (`accent` not `gold`)                                                                    | Switching core themes must not leave misleading names                                       |
| 9 Oct  | Light scheme (Marble) built now, dark stays default                                                                             | Theme switching is a stated requirement; contrast tests keep both readable                  |
| 9 Oct  | `app.json` `userInterfaceStyle` stays `automatic`                                                                               | Lets `colorMode: 'system'` work; the app's own default is still dark                        |
| 9 Oct  | Sounds generated as WAV from the prototype recipes                                                                              | Matches the design exactly; a new theme can ship its own set                                |
| 9 Oct  | Fonts imported per weight from subpaths                                                                                         | Package index would bundle all 14 Figtree weights                                           |
| 9 Oct  | Android package `com.ninjavashist.vinco` (placeholder), test APKs from EAS "preview" profile                                    | Developer's choice; permanent only once uploaded to Play                                    |
| 9 Oct  | Play closed-test build moved to Step 6 (before the database)                                                                    | The 14-day closed test must start by 12 Oct to make 2 Nov                                   |
| 9 Oct  | State: Zustand for app/UI state (persisted), SQLite + Drizzle live queries for records, never mirrored; TanStack Query from 1.0 | Developer's decision. One source of truth per kind of data                                  |
| 9 Oct  | Zustand persisted to expo-sqlite kv-store with its sync API                                                                     | One storage engine for the app; synchronous restore means no flash of default theme or tone |
| 9 Oct  | ThemeProvider made controlled (no internal copy of preferences)                                                                 | One source of truth: the store                                                              |
| 9 Oct  | Custom tab bar instead of styling the default one                                                                               | The prototype's two-line Latin/plain labels don't fit the default label slot cleanly        |
| 9 Oct  | Default tone before onboarding: Centurion                                                                                       | The app's core voice ("orders", "soldier"); onboarding sets the real choice                 |
| 9 Oct  | Theme lab opened by long-pressing the Vici tab, dev only                                                                        | Keeps dev tools out of real screens                                                         |
| 9 Oct  | Three kinds of to-do: orders (decide the day, min and full goal), daily tasks, day tasks (never affect sealing)                 | Developer's structure; spec in docs/ORDERS-AND-TASKS.md                                     |
| 9 Oct  | Own orders: one tap per level (minimum, then full), max 4, start today, stand down from tomorrow                                | Keeps the core job one tap; removing an order can never rescue the day in progress          |
| 9 Oct  | Day results stored at sealing (`day_logs.result`)                                                                               | Changing orders must never rewrite history                                                  |
| 9 Oct  | Truces called by the user; earned (1 at arc start, 1 per 7-day campaign, max 3) or bought (50 denarii) when needed              | Developer's decision. A Truce is a choice and a reward, not a silent weekly pass            |
| 9 Oct  | A Truce covers only the missed run ending yesterday, one Truce per missed day                                                   | Simple rule ("before the next day ends"); never rewrites history past sealed days           |
| 9 Oct  | Journey reset wipes records, selfies and oath; keeps preferences. Confirmed by typing RETREAT                                   | Developer's request; typed word stops an accidental wipe                                    |
| 9 Oct  | Dev mode: a persisted day offset in `useDevStore`, read by `useToday` (dev builds only), only ever moves forward                | Tests history and sealing on a real phone; going back would leave sealed future days        |
| 10 Oct | Open plan named the **Ludus** (Training ground), stored as `arcs.kind`, length 3650 so ranges keep working                      | Themed and plain; the sentinel avoids touching every date range                             |
| 10 Oct | The Forum ships on the local ledger in Early Access; Truces can be bought ahead (one a day, max 3)                              | Developer's request; the server ledger replaces it with accounts (BACKEND-PLAN)             |
| 10 Oct | Settings move to a fourth tab, Castra                                                                                           | Developer's request; Vici becomes the record of the journey                                 |
| 10 Oct | Seal and stamp sounds play with Sounds off (`feedback.essential`); the phone's silent mode still mutes them                     | Developer's request: the two signature moments                                              |
| 17 Oct | Own orders: unit and number optional (done or not); every order editable; a lower own goal starts tomorrow (successor row)      | Lowering can never rescue the day in progress, same rule as standing down                   |
| 17 Oct | Vinco's full goals editable from today; minimums stay fixed                                                                     | Holding a day never gets easier, so no need to wait a day                                   |
| 17 Oct | Selfies shrunk to 1080 px on capture                                                                                            | Memory on retake, and a year of selfies in megabytes, not gigabytes                         |
| 10 Oct | Native features go through bridge contracts (`guardBridge`, `auroraBridge`) with stubs                                          | Runs in Expo Go now; the Kotlin modules replace one line each later                         |

### Questions for the developer (parked while working)

Answer when convenient; work continues with the safe default shown.

1. **Play account.** Package name set to the placeholder `com.ninjavashist.vinco` (developer's choice, 9 Oct). It becomes permanent on the first Play upload, so confirm or change it before then. No Play account yet.
2. **Splash art.** The app icon is done (`assets/app-icon/vinco_dark_v1.png`, built into every size by `npm run icons`). The splash shows the same mark on Basalt. Say if you want a different splash.
3. **Onboarding order:** built as the prototype's five steps (arc, orders with wake time, tone, oath, selfie). Bedtime moves to Step 12 (wind-down nudge) and step one to a Today card (Step 12). Change if you prefer otherwise.
4. **Default tone before onboarding.** Default: Centurion.
5. **Truce numbers.** Built: one Truce when an arc begins, one per 7 days of campaign, at most 3 held, 50 denarii to buy, and the Truce must be called before the day after the miss ends. All in `TRUCES` (`src/features/campaign/truces.ts`). Say if you want different numbers or a longer window.
6. **Truces as decorations.** "Collected as achievements" is built as earning through campaign weeks. When decorations arrive (Step 13), some could also grant a Truce. Say which.
7. **Rank thresholds and denarii amounts** are the plan's first guesses, kept in one config each (`src/features/campaign/ranks.ts`, `denarii.ts`).
8. **Dev mode in test builds.** Built for dev builds only (`IS_DEV_MODE_AVAILABLE = __DEV__`). Say if closed testers should see it too.
9. **Own orders: limits and onboarding.** Built: at most 4 own orders, logged in two levels (minimum, full goal), added from Today or "Your orders", not in onboarding yet. Say if you want them on the onboarding orders step, a different limit, or exact amounts instead of two levels.
10. **Task limits.** 10 daily tasks, 20 per day, 60-character titles; day tasks can be planned for today or tomorrow only. Say if you want a date picker for further ahead.
11. **Campaign-lost tone line.** The product rule says slip screens stay neutral, but the prototype gives this screen a tone line. Kept the tone line (the Roast one aims at the phone, not the person). Say if it should be neutral.

### Open decisions (longer term)

- Studio name and Android package name (before the first Play upload, Step 6).
- Play Console account: new personal (needs 12+ testers for 14 days) or an older one.
- App icon and splash art (current images are the Expo template's).
- Where "wake and sleep times" and "step one" sit in onboarding: the prototype's indicator shows five steps (arc, orders, tone, oath, selfie), the plan lists more.
- Rank thresholds and earn rates (tune with Early Access data).

### Noticed, not done

- `app/(tabs)/veni.tsx` is about 485 lines after Wave 3 (under the 500 limit). If it grows, move the quick-log list and the no-orders card into their own components.
- `useSealFinishedDays` runs in the tab layout. Screens over the tabs (Settings) keep it running, but a direct link into a stack screen would not seal until the tabs mount.
- Template leftovers not used by the app: `assets/images/react-logo*.png`, `expo-badge*.png`, `expo-logo.png`, `logo-glow.png`, `tutorial-web.png`, `tabIcons/`; packages `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `expo-device`. Remove when convenient (`expo-device` may be useful later).
- `docs/v1-reference/` (the plan HTML) still describes the weekly Truce; it's a reference snapshot, left as is. PLAN.md is updated.
- `assets/images/android-icon-background.png` is no longer referenced (the adaptive icon uses a background colour). Delete with the other template leftovers.
- Thud-based cues (stamp, cross, seal) put most energy at 40 to 140 Hz, which phone speakers barely play. Kept as the prototype has it; lifting the brass layers or adding an octave-up layer would make the stamp fuller on a phone. Ask the developer.
- **File size:** every source file is under the 500-line ceiling (largest: `veni.tsx`, 498). Leave as is for now (developer, 9 Oct). Split `veni.tsx` before it grows further. `src/__tests__/routes.test.tsx` (974) can be split by area when convenient.
- Decorations are computed for the current arc only and pay no denarii yet (they'd need ledger awards; easy once the set is final).
- The Forum's app icons are owned but can't switch until a development build adds alternate icons (GUARDIANS.md, order of work 5).
- Notifications, the error boundary and the accessibility pass are still open (Steps 12 and 14).
- `npm audit` reports 30 advisories in the dependency tree (mostly dev tooling). Review before the production build.
- `README.md` is now a short project readme.

---

## Milestone log

### 17 Oct 2026: bug fixes and editing orders (still 1.1.0)

- **Free training sealing (bug):** `useSealFinishedDays` called `toOrderTargets` without the arc's kind, so free-training days were judged on all four Vinco orders and sealed as missed. Now passes `arc.kind`. Days already sealed wrongly stay (sealed days never change); only the developer's own phone had any.
- **Day card (bug):** rows come from `orderKindsIn(targets)`, so free training shows only its orders; done-or-not orders read "Done".
- **Selfie retake (bug report: blank white screen):** not reproducible in tests. Most likely cause: full-size shots (3000 px or more) held several at a time running the phone out of memory. Fixes: `shrinkPhoto` (`expo-image-manipulator`, 1080 px, JPEG 0.82, native memory released) before review; `CameraView` stays mounted under the review image; the shutter waits for `onCameraReady`. If it still happens, note whether it's Expo Go or the APK and whether a red error shows.
- **Done-or-not orders:** unit and number optional (`toCustomOrderDraft(name, unit, null)` = once a day); `isCheckOrder`, `customOrderMode` ('check', 'tap', 'typed'); copy on Today, plan, onboarding, day card and day summary.
- **Editing:** `editCustomOrder` (higher or equal: today; lower: from tomorrow via a successor row with `replaces_id`, migration 0010; editing again changes the successor; raising drops it), `standDownCustomOrder` also removes a waiting successor, `addCustomOrder` counts waiting successors toward the limit, `startNextArc` carries today's progress for a successor. `setArcOrderFull` for Vinco's full goals (fitted to the onboarding ranges; minimums fixed, so applies today). `OrdersPanel` rebuilt with Edit on every order; tasks on `/plan` show the pencil.
- Tests: new `src/__tests__/plan.test.tsx`; edit rules in `db/__tests__/customOrders.test.ts`; goals in `arcs.test.ts`; selfie retake from the check. 49 suites, 463 tests.

### 14 Oct 2026: version system

- `docs/releases/`: semantic versioning rules (MINOR for features and changed flows, PATCH for fixes), one file per version with front matter for a later backend import, release notes (users, 500 characters at most) and a changelog (team: Added, Changed, Removed, Fixed, Data).
- `v1.0.0.md`: the baseline, every feature up to 12 Oct. `v1.1.0.md`: Wave 3, in progress, with a was-and-now table of changed flows.
- `app.json` and `package.json` at 1.1.0; the version code stays with EAS (remote, auto-increment). New working rule 11 in CLAUDE.md.
- Flagged: the product plan calls the 1 January 2027 release "Vinco 1.0", which clashes with the app's version numbers (releases README, last section).

### 14 Oct 2026: docs brought up to Wave 3

- Archived the finished Wave 2 plan to `docs/docs-v1.0.0/WAVE-2.md` (with a note on what Wave 3 changed); links updated.
- Updated DAY-FLOW (Today layout, quick logs, own order counting, day summary, body chart, sounds), ORDERS-AND-TASKS (orders per arc, own order form, limit 6, auto carry-over, user menu), UI-KIT (Wave 3 components, scaled sizes), DESIGN-SYSTEM (trimmed type and layout, width scaling, sounds off, essential cues), CONVENTIONS (folder tree), GUARDIANS (menu path), BUILD-STEPS (status, Wave 3), and a "changed since" note atop v1-docs/PLAN.md.

### 13 to 14 Oct 2026: Wave 3, orders-first onboarding and a clean Today

- **Onboarding:** `/onboarding/plan` comes first (suggested water and workout, own orders with name, unit and how many; zero is allowed). Continue starts free training with exactly those orders; "Choose a ready-made campaign" goes to the length and Vinco's four. Step numbers follow the path (IV or VI steps). The oath asks about three months without a campaign.
- **Orders per arc:** `OrderTargets` is now partial; an arc has only the Vinco orders it has rows for (a campaign keeps all four). `orderKindsIn`, `targetFor`, `addArcOrder`, `removeArcOrder` (free training only). A day with no orders never holds. Wake-up is still logged (sleep) without being an order.
- **Own orders:** name, unit, how many, saved with min = full. A tap adds one (up to 20), a hold takes one back; bigger goals open `OrderAmountSheet`. Limit 6. Older orders with a lower minimum still work.
- **Today:** rebuilt around `ScreenHeader` with the user button, chips (campaign or run, denarii), `QuickLogs` (selfie, weight, calories: loud until done, then a small checked circle), `OrderList` (done orders sink with a slide, count in the heading), a water suggestion in free training with no orders, the run nudge. Removed: the tone quote line, the progress ring, the proof tiles (timelapse plays from Vidi), the rank chip.
- **User menu** (`components/menu/UserMenu.tsx`): account preview, Settings, Orders and to-dos, Permissions, Guard, Aurora, Forum, and the oath (twice a day, `useOath`, counted in the notices store). Settings is a stack screen; the Castra tab is gone. New `/permissions` (camera and microphone live, reminders and reel counter later).
- **To-dos:** undone day tasks move to today on their own (carry-over card and copy removed).
- **Vidi:** `BodyChart` draws weight and calories on one date axis, each on its own scale, each hideable (saved as `hiddenBodyLines` in preferences). Tapping a calendar day opens `DaySummarySheet` (orders against goals, sleep, weight, calories, selfie, to-dos ticked). Free training shows missed days as days off.
- **Calories:** `day_logs.calories` (migration 0009), `CaloriesSheet` with +100, +250, +500.
- **Fit real phones:** `theme/tokens/scale.ts` scales spacing, layout sizes and type to the window width (down to 84%, type less); touch targets and borders never shrink. Base sizes trimmed (buttons 52, rows shorter, title 28) and font-size caps lowered.
- **Sounds:** off by default for new installs; `recordStop` (the oath locking in) joins the seal and stamp as always-on.
- Tests: 445 passing (new: arcs per-arc orders, day results with no orders, calories, scale, onboarding own plan, quick logs, done orders sink, own order counting, menu, permissions, free training suggestions and removal, auto carry-over).

### 13 Oct 2026: backend plan, `vinco-backend` repo laid out

- The server repo is **`vinco-backend`** (sibling folder; was `vinco-api` in these docs). Its `.claude/CLAUDE.md`, `HISTORY.md` and `docs/` (PLAN, ARCHITECTURE, AUTH, DATA-MODEL, API, CONVENTIONS, SETUP) hold the plan. No server code yet.
- First scope: auth (Better Auth: email code, Google, Apple with iOS), accounts and sessions, anonymous installs and app usage (sessions with a 60 s heartbeat, a short event allow-list), admin stats (users, installs, live now, daily actives).
- One API for Android, iOS and web (`/v1/...`), admin at `/v1/admin/...`. Hono, `@hono/zod-openapi`, Drizzle on Supabase Postgres (Mumbai), pino, Sentry, Vitest with PGlite, Cloud Run.
- **For this app (Phase 4 of that plan):** flags `FEATURES.account` and `FEATURES.usage`, recommended off for the 2 Nov Early Access build. Accounts stay optional; usage calls are queued and never awaited, so the core job doesn't change.

### 10 Oct 2026: "Free training", done tasks to the bottom

- **Renamed the open plan** from "the Ludus" to **Free training** on every screen (developer: something simple). Onboarding card "Free training", Today "Free training · Day XII", Vici title "Free training" with "Since 3 Oct · Day XII", day card "FREE TRAINING · DAY XII", buttons "Switch to free training". The code and database keep the arc kind `ludus` (and names like `isLudus`), so no migration; comments say "free training (the 'ludus' kind)".
- **Done tasks move to the bottom:** `sortDoneLast` (`src/features/tasks`) orders open tasks first, done ones last, each in the order added; `useTasks` applies it to every list and Today's combined list does the same. Unticking brings a task back up. `TaskItemRow` slides to its new place (`LinearTransition`, 220 ms, off with reduced motion).
- Tests: `sortDoneLast` unit tests; a route test ticks and unticks a task on Today and checks the order.

### 10 Oct 2026: Wave 2 (9/9): backend plan, docs, polish

- [docs/BACKEND-PLAN.md](docs/BACKEND-PLAN.md): principles (local first, selfies never leave, the server decides money), stack, table-by-table mapping with sync rules, outbox sync (bootstrap, push, pull), v1 endpoints, anti-cheat, the ten features that need a backend, order of work, and what the app changes.
- Docs updated: CLAUDE.md (doc table, Ludus, Forum, essential sounds, bridges, vocabulary, four tabs), DESIGN-SYSTEM (whisper tier, essential cues), DAY-FLOW (sounds), UI-KIT (new components and kit changes), BUILD-STEPS (Wave 2), PLAN (Forum in Early Access, Ludus).
- Polish: Ludus wording on the orders step, the timelapse ("Your training"), Forum Truces ("Kept for your next campaign"), Vici's Ludus record (days since Day I); new chip variants in the theme lab.
- Verified: `npm run check` green (417 tests, 46 suites), no console warnings, Android bundle exports.

### 10 Oct 2026: Wave 2 (8/9): guard levels and Aurora, base

- Plan and native integration guide: [docs/GUARDIANS.md](docs/GUARDIANS.md) (levels, rules, what needs Kotlin, permissions, Play declaration, order of work).
- `src/features/guard/`: `GUARD_LEVELS` (pax, vigil, guard, imperium), `GUARD_LEVEL_SHIPS`, `GUARD_RULES` (budget 30 in 5 to 200, milestone every 25, Tributum 15 doubling three times, Clementia 10 min, 24-hour cool-off), `getReelMilestone`, `getTributumPrice`, `getReelAllowance`, `getImperiumGate`, `levelIncludes`. `GuardBridge` contract and `unsupportedGuardBridge` (`guardBridge` is the one place to swap in the native module).
- `src/features/aurora/`: `AuroraSettings` (on, minutes, Monday-first days, mission: march, sky, post), `getNextRing`, `sanitizeAuroraSettings`, `AURORA_RULES`. `AuroraBridge` contract and stub.
- `useGuardStore` (persisted `vinco.guard`: level, reel budget, Aurora). Reset by dev "reset everything", kept by the retreat (it's a preference).
- UI: Settings group "Guard" (Guard level, Aurora alarm with its time or Off). `/guard` (four levels with version badges, reel budget stepper, privacy promise) and `/aurora` (on, time defaulting to the wake-up time, days as multi-select chips, mission, next ring, alarm passes held), both with a `PreviewNotice` ("Arrives with the Vinco build").
- `ChoiceChip` gained `isMulti` (checkbox, can be turned off, 44 wide) and `accessibilityLabel`.
- Tests: guard and Aurora rules, store, `src/__tests__/guard.test.tsx`.

### 10 Oct 2026: Wave 2 (7/9): own to-dos and orders, switched on

- `FEATURES.customOrders` and `FEATURES.tasks` are **on**. Spec updated: [docs/ORDERS-AND-TASKS.md](docs/ORDERS-AND-TASKS.md), "Screens".
- **One sheet for everything** (`components/tasks/TaskSheet.tsx`, replaces `AddTaskSheet`): what, then "How often?" (Just today, Tomorrow, Every day, An order). "An order" hands the name to `AddOrderSheet` (`initialName`). The same sheet edits a task (rename, how often, make it an order, remove). `TaskSheets` wires the two together for Today and `/plan` (targets: add, edit, order).
- **Today:** `TodayTodo` replaces the to-do tile: every-day and today tasks inline (5 max), tap to tick, hold or pencil to edit, carry-over line, "Add to your day", "See all (n)" / "Manage". "Add an order" opens the order step through the same sheets.
- **`/plan` ("Orders and to-dos")**: segments Orders and To-do (`OrdersPanel`, `TodoPanel` in `components/plan/`, moved from the old screens). `/orders` and `/tasks` redirect. Settings has "Orders and to-dos" under Your day.
- DB: `changeTask` (remove from today on, add again; keeps today's tick when it still shows today), `convertTaskToOrder` (one transaction). Hooks: `useTasks.change`, `useOwnOrderActions.convertTask`. `TaskItemRow` takes `onEdit` (long press, accessibility action) and an optional `onRemove`.
- Removed: `TodoTile`, `todayCopy.todoTile`.
- Tests: `src/__tests__/todo.test.tsx`; task change and conversion in `src/db/__tests__/tasks.test.ts`. Verified: `npm run check` green, 402 tests.

### 10 Oct 2026: Wave 2 (6/9): Vici rebuilt

- Vici is now the record of the journey: header (arc or "The Ludus" with "Training ground since ..."), journey line (campaigns only), the campaign choice, rank, **Your record** (`RecordGrid`: campaign, best, conquered, held, Truces called, selfies; Ludus: days trained instead), **Treasury** (`TreasuryCard`: denarii, Truces (opens the Truce rules), alarm passes, "Visit the Forum"), **Decorations** (`DecorationGrid`, earned gold, locked dashed with how to earn), all your proof, **Past arcs** (`PastArcList`), and a quiet "Train in the Ludus instead" at the bottom of an active campaign.
- Decorations: `src/features/campaign/decorations.ts` (`getDecorations`): First seal, Conqueror, Iron week (campaign only), "Resurgo", Halfway to Rome (30 days trained in the Ludus), Proof keeper (7 selfies), Oath keeper (Day X with an oath). Computed from the current arc's records, no storage. They don't pay denarii yet.
- Arc history: `summarizePastArcs` (`src/features/arc/history.ts`) and `useArcHistory` (`selectAllArcs`, new `selectSealedResults`). An arc ends where the next began.
- Switching: `useArcChoice` (`beginCampaign`, `trainInLudus`, both via `startNextArc`), `ArcChoiceCard` (Ludus, finished, active), `BeginCampaignSheet` (30/60/90), `LudusSheet` ("This is not a retreat: nothing is wiped"). Today shows a "Campaign complete" card after the last day, leading to Vici.
- `RankCard` no longer shows denarii (the treasury does).
- Tests: `src/__tests__/vici.test.tsx`.

### 10 Oct 2026: Wave 2 (4/9 and 5/9): the Ludus, the Forum

- **Ludus (Training ground):** open training with no streak and no fall. `arcs.kind` (`campaign` or `ludus`, migration `0007_arc_kind`). A Ludus stores `LUDUS_LENGTH_DAYS` (3650) so date ranges keep working; code branches on `kind` only. `createArc` grants no starting Truce for a Ludus; any active arc ends first (`endActiveArc`: finished if past its last day, else abandoned). `startNextArc` moves to a new arc today carrying the four goals, wake time, oath and active own orders (with today's progress). `selectAllArcs` for history. Sealing in the Ludus pays day denarii but no weekly bonus or Truce. `useCampaign.isLudus`; no Truce offer; `useLossNotice` ignores the Ludus.
  - UI: step I has a fourth card "Ludus · Training ground" (store `arcKind`, `chooseLudus`); step V copy without a day count. Today: eyebrow "Ludus · Day XII", chip "N days trained", no sick-day button. Vidi: Days trained, Full-goal days, Selfies. Day card: "LUDUS · DAY XII" and days trained.
  - `veni.tsx` helpers moved to `components/today/describeArcHeader.ts` and `describeOrderRow.ts` (498 to about 430 lines).
- **Forum and the economy:** `src/features/forum/` (catalogue `FORUM_ITEMS`, `checkPurchase`, `denariiShort`, `EARN_WAYS`). Items: Truce (50, max 3 held, one a day), Alarm pass "Venia" (40, max 2, used when Aurora arrives), Aurum and Nox day card styles (150, work now), Laurel and Marble app icons (200, switch once native icon switching ships). Tables `purchases` and `item_uses` (migration `0008_forum`). Balance = ledger minus purchases (`getDenariiBalance` moved to `db/forum.ts`; `useCampaign` subtracts purchases too). `buyItem` (one transaction, checks again, Truce goes into the reserve with reason `forum`), `useItem`, `toHoldings`. Hook `useForum` (balance, earned this week, holdings, history, buy).
  - UI: `/forum` with the purse, segments Shop, Earn ("Aerarium") and History. `ForumItemCard`, `ItemArt`, `PurchaseSheet` (the button says why not: "Need 30 more", "Reserve full", "One a day. Back tomorrow"), `EarnList`, `TreasuryHistory`. Today has a silver purse chip that opens the Forum (`StatChip` can now be pressed). The day card shows bought styles and "More card styles in the Forum". New icons: coin, shield, bell, card, laurel, medal, history, alarm, eye, block, dove, plus, edit.
- Verified: 380 tests across 38 suites.

### 10 Oct 2026: Wave 2 (1/9 to 3/9): sounds, fit every phone, Settings tab

- Plan for the whole wave: [docs/docs-v1.0.0/WAVE-2.md](docs/docs-v1.0.0/WAVE-2.md) (Ludus, to-dos, Forum, Settings and Vici, sounds, responsive, guard levels and Aurora, backend).
- **Sounds:** new `whisper` tier (-17 dBFS) for the tab whoosh, shorter and narrower. `FeedbackSet.essential` (`seal`, `stamp`) play even with Sounds off; the phone's silent mode still mutes them. Test: `src/theme/__tests__/feedback.test.tsx`.
- **Fit every phone:** onboarding step II stacks the minimum and the "Conquer" stepper below 420 dp (divided by font scale); stepper values shrink to fit instead of "2...". `SelfieCapture` has `fill` (frame flexes, shutter always visible) and otherwise a frame height from the window (50%, 220 to 420). Onboarding step V (`FlowLayout scroll={false}`) and the daily selfie (before the shot) don't scroll. The timelapse frame flexes. Rule added to CONVENTIONS section 7.
- **Settings tab:** fourth tab "Castra · Settings" (`(tabs)/settings.tsx`, `settingsCopy`). Groups: You (tone, appearance, sounds with the always-on note, vibration, selfie outline), Your day (wake-up time, new `setArcWakeTime`), Your oath, About (version, dev mode), Journey (Sound the retreat), dev tools. `components/settings/`: `SettingsGroup` (draws the lines between rows), `SettingsRow` (moved from `arc/`, now with `detail`), `ToneSheet`, `AppearanceSheet`, `OutlineSheet`, `WakeTimeSheet`. Vici lost its settings (rebuilt later in this wave).
- Tests: shared route helpers moved to `src/testing/routeKit.ts`; settings, retreat and dev mode tests in `src/__tests__/settings.test.tsx`.

### 9 Oct 2026: Loss notice fix, sick day, stamp on conquest, timelapse

- **Fix: the campaign-lost screen kept coming back.** Each extra missed day in a run counted as a new break, and the notice was only marked as seen once the screen mounted (a re-render in between could open it twice). Now a break is named by the first day of its run of misses (`findLatestLoss().firstMissedDay`) and `useLossNotice` acknowledges it at the moment it opens the screen. The screen no longer acknowledges anything itself. Regression test: a run of misses across two days shows once.
- **Sick day:** "Feeling sick today" on the dawn card. `callSickDay` (reserve first, then denarii; refused when unaffordable or sealed; idempotent), `cancelSickDay` (same day, refunds the Truce and any denarii), and at sealing a sick-day day that was held gets its Truce back (`refundTruce`, reason `refunded`), a missed one becomes a Truce day. UI: `SickDaySheet` (exact cost), `SickDayCard` ("I'm feeling better"), chip "Sick day"; orders are not gated on a sick day.
- **The VINCO stamp only on a conquered day** (every order at its full goal). Held days get the "Line held" seal card, matching the calendar.
- **Hint:** "Tap to log. Press and hold to take one back." under the orders heading.
- **Timelapse:** `/timelapse` (full-screen, dark), `useSelfieReel(scope)`, `selectSelfiesBetween`. Arc scope from Today (`TimelapseTile`) and Vidi's timelapse card; every arc from Vici (`AllProofCard`). New icons: play, pause, replay.
- Verified: 349 tests, no console warnings, Android bundle builds.

### 9 Oct 2026: Polish: sounds, selfie, dawn and sleep, proof, Commentarii

- Spec first: [docs/DAY-FLOW.md](docs/DAY-FLOW.md).
- **Sounds:** an audit found all 17 recipes match the prototype exactly. Levels were the problem: one shared gain set by the stamp's sub-bass left ticks at -14 to -16 dBFS, then a 0.8 player volume. Now each cue is scaled to its tier (ticks -6, moments -3, signature -1.5, soft -9 dBFS), the theme plays at volume 1, and the sound bank rewinds before playing (no click on rapid taps). New `whoosh` cue for tab switches.
- **Feature flags:** `src/config/features.ts`. Own orders and the to-do list are off: hidden, routes redirect, and `selectCustomOrdersOn` matches nothing so own orders can never count while off. Their tests switch them on with `jest.replaceProperty`.
- **Selfie:** each capture gets its own file name (`YYYY-MM-DD-<time>.jpg`), and the replaced file is deleted after the new path is saved (the retake bug was the image cache showing the same URI). Review step: "Face inside the outline, like yesterday?" with Looks right or Retake; nothing is saved until confirmed. The ghost is the latest earlier selfie, with a slider from 0 to 60% (`ghostOpacity` in preferences, default 30%). Real face detection needs a custom build.
- **Dawn and sleep:** `DawnCard` until wake-up is logged (orders dimmed and not tappable). `WakeSheet` with `TimeField`s (native clock): woke up at (now) and went to sleep at (last bedtime, else 11 pm), live hours slept, validation (1 to 16 h, not in the future; no future check on the dev clock). Saved through `logWakeUp` in the orders transaction (stamp-aware). Migration `0006_day_sleep` adds `day_logs.slept_at`. Logic in `src/features/sleep/`.
- **Amounts past the goal:** `ORDER_MAX_AMOUNTS` (water 10 L, meals 8, workout 300 min); lines read "5 L · conquered, 1 over"; the workout sheet has an exact-time stepper.
- **Proof on Today:** "Proof" section with the selfie tile and a new body weight tile and sheet, both with call-to-action styling until done.
- **Commentarii (Vidi):** `SegmentedControl` (Calendar, Commentarii). Chips for sleep, water, workout, weight. Week bars after the prototype with week arrows inside the arc, insight lines; weight as weekly trend plus a line across the arc and a log button. Logic in `src/features/logs/`, data in `useCommentarii`.
- New packages: `@react-native-community/slider`, `@react-native-community/datetimepicker` (both in Expo Go).
- Verified: 336 tests, no console warnings, Android bundle builds.

### 9 Oct 2026: App icon

- Source: `assets/app-icon/vinco_dark_v1.png` (the developer's icon: light V and leaf on a dark rounded tile).
- `scripts/generate-icons.mjs` (`npm run icons`) lifts the mark off the tile by brightness (cut set in the gap of the image's histogram, small specks and glow dropped) and writes the adaptive foreground and monochrome layers (inside Android's safe circle), the full-bleed `icon.png`, the splash mark and the favicon. Adaptive icon background `#131318` (the tile's colour); splash mark 120 wide on Basalt.
- Re-run after replacing the source; then rebuild the APK (icons are baked into the build, Expo Go shows its own).

### 9 Oct 2026: Test APK setup

- `app.json`: `android.package` = `com.ninjavashist.vinco` (placeholder until a Play account exists).
- `eas.json`: `preview` profile builds an installable APK (internal distribution) with `EXPO_PUBLIC_DEV_TOOLS=1`; `production` builds the Play bundle (AAB) with auto-incremented version codes (stored on EAS: `appVersionSource: remote`).
- `IS_DEV_MODE_AVAILABLE` is now true in dev builds and preview APKs, never in production. The theme lab and the Vici long-press use the same flag.
- Build: `npm install -g eas-cli`, `eas login`, `eas build -p android --profile preview`, then open the build link on the phone and install. EAS keeps the signing key; keep using it so updates install over the old APK and keep data.

### 9 Oct 2026: Orders and tasks

- Spec first: [docs/ORDERS-AND-TASKS.md](docs/ORDERS-AND-TASKS.md) (three kinds, rules, screens, data).
- Migration `0005_orders_and_tasks`: `custom_orders`, `custom_order_logs`, `tasks`, `task_completions`, `day_logs.result`.
- Logic: `src/features/orders/customOrders.ts` (limits, validation, levels), `src/features/tasks/` (daily vs once, limits, carry-over, summary). `getDayResult` takes own-order statuses.
- Database: `src/db/customOrders.ts` (add, stand down, logs), `src/db/dayStanding.ts` (`getDayStanding`: the one place that decides "held", used by the stamp and sealing), `src/db/tasks.ts` (add, tick, remove, carry over or drop). Sealing stores each day's result; older sealed days are still computed. Child rows are deleted explicitly (foreign keys are off in the app's SQLite).
- Hooks: `useTodayOrders` includes own orders (`customOrders`, `totalCount`, `addOneCustom`, `undoOneCustom`), `useCampaign` judges today with own orders, `useTasks`, `useOwnOrderActions`.
- UI: own order rows and "Add an order" on Today, ring and progress line out of the real total, `TodoTile`, routes `/tasks` and `/orders`, `AddOrderSheet`, `TaskItemRow`, `CarryOverCard`, `AddTaskSheet`, "Your orders" in Vici, own orders on the day card (compact rows above five).
- Verified: 308 tests (validation, levels, stamp only when own orders hold, stand down, history unchanged after stand down, add, tick, remove, carry over and drop), no console warnings; Android bundle builds with the migration.

### 9 Oct 2026: Truces by choice, retreat, seal card, dev mode, Roast rewrite

- **Truces reworked** (developer's rule): no automatic weekly Truce. Missed days stay missed until the user calls a Truce. New table `truces` (migration `0004_truces`, which also grants the starting Truce to an arc already in progress), `src/features/campaign/truces.ts` (`TRUCES`, `planTrucePayment`, `findTruceableDays`, `getTruceOffer`, `earnsTruce`), `src/db/truces.ts` (`callTruce` in one transaction, double-tap safe; `grantTruce` capped). Sealing earns a Truce every 7 days of campaign; `createArc` grants one. Denarii ledger takes `truce_bought` (negative). `findLatestLoss` now measures from the start of a missed run. The loss notice only reopens for a later break.
- **Campaign lost** offers "Save the campaign" with a Truce (reserve first, then denarii) or Rise again; a Truce leads to "The line holds". Today shows `TruceBanner` while the offer lasts. Chips and Vici show Truces in reserve (tap for how to earn them).
- **Seal the day**: `SealDayCard` stays on Today once all four orders hold, so the day card is never lost by dismissing the stamp.
- **Sound the retreat** (Vici): `RetreatSheet` with a typed RETREAT; `useResetJourney` wipes the database (`clearJourney`), selfies and oath (`deleteAllMedia`), the onboarding draft and notices, then replaces to the Rubicon. Button gained a `danger` variant (wax seal).
- **Dev mode** (dev builds): `useDevStore` (persisted), `useToday` applies the day offset, `src/dev/DevPanel.tsx` and `src/dev/devActions.ts` (`fillDayOrders`), reset everything also resets preferences and the clock.
- **Copy**: Roast lines rewritten to be properly unhinged (aimed at the phone, the scroll and the excuse; each ends with a way forward). Latin phrases shortened and quoted ("Alea iacta est.", "Perfer et obdura.", "Resurgo").
- Verified: 281 tests (Truce call, Truce banner, price refusal, retreat with wrong and right word, dev next day and reset, seal card after the stamp), no console warnings; Android bundle builds with the migration.

### 9 Oct 2026: Day card (Step 13, part)

- Installed `react-native-view-shot`, `expo-sharing` (config plugin added).
- `DAY_CARD_STYLES` in the theme (contrast-tested; Marble's gold deepened from the prototype's 4.1:1 to pass 4.5:1), `Laurel` gained `strokeColor` for fixed artwork, new `Toast` kit component, `components/dayCard/DayCard`, route `/day-card` (full-screen modal), `src/copy/dayCard.ts`.
- "Seal the day" on the VINCO stamp now opens the day card.
- Verified: 255 tests (sealing flow through the UI to sharing, and the unavailable path), no console warnings; Android bundle builds.

### 9 Oct 2026: Step 10 finished, daily selfie

- `/selfie` (full-screen modal, kept dark): yesterday's photo as the ghost (Off / Faint / Strong), flip, retake, saved line with timelapse frames, recent strip, optional weight. Today has a `SelfieTile`.
- `SelfieCapture` moved to `src/components/` and shared with onboarding; camera wording moved to `src/copy/proof.ts` (neutral in every tone, per the product rule).
- Migration `0003_day_weight`; `parseWeightKg` (30 to 250 kg, comma decimals) in `src/features/proof/`; `selectRecentSelfies`; `useDailySelfie`.
- Jest camera mock now takes a "photo" through its ref, so the capture flow is tested end to end.
- Verified: 250 tests, no console warnings; Android bundle builds.

### 9 Oct 2026: Steps 10 (most) and 11, Vidi and Vici

- Vidi: `StatTile`, `MonthCalendar` (`components/progress/`), arc-limited month navigation, timelapse card. `monthGrid` and `shiftMonth` in dates.
- Vici: `ArcJourney`, `RankCard`, `SettingsRow` (`components/arc/`), tone and appearance sheets, `useOathPlayer`, `OATH_PLAYBACK_DAY` and `getArcMilestones` in the arc feature.
- Campaign lost: `findLatestLoss`, `useNoticesStore` (persisted, validated), `components/campaign/Column`, route `/campaign-lost` (full-screen modal), `useLossNotice` in the tabs layout.
- `useCampaign` now also gives today's status and selfie count. Icon `forward` added.
- Fixed: `findLatestLoss` sort direction (caught by its test); the test `useLiveQuery` now re-reads after mount like the real hook (it hid rows written by earlier effects).
- Verified: 233 tests, no console warnings; Android bundle builds.

### 9 Oct 2026: Step 9, campaign engine

- `src/features/campaign/` (results, campaigns, Truce weeks, Resurgo, ranks, denarii), migration `0002_ledger`, `src/db/sealing.ts` (seal finished days, queries, row-to-record conversion), `eachDay` in dates.
- Hooks: `useSealFinishedDays` (tabs layout, on open and midnight), `useCampaign` (live campaign, best, completed days, rank, Truce, denarii).
- Today shows campaign, Truce and rank chips once data exists.
- Decision: Truce applied automatically to a missed day (see question 6).
- Verified: 218 tests, including sealing on real SQL and a render test from saved rows to the chips; no console warnings.

### 9 Oct 2026: Step 8, onboarding

- Installed `expo-camera`, `expo-file-system`; permission texts set in `app.json` (camera plugin does not ask for the microphone).
- Migration `0001_arc_settings_and_selfie`. New: `src/db/arcs.ts` (create arc with its orders in one transaction, one active arc at a time, targets parsed defensively), `src/features/arc/` (lengths, end day, position), order tuning ranges and `buildOrderTargets` in `src/features/orders/tuning.ts`, clock helpers in `src/lib/dates.ts`, `src/media/`, `useOnboardingStore` (persisted draft), `useActiveArc`, `useCompleteOnboarding`.
- Components: `StampSlam` (shared by Today and the selfie), `onboarding/` set. Six routes under `src/app/onboarding/`. Entry route decides between Today, a resumed step and the Rubicon.
- Copy: `src/copy/onboarding.ts`; month names, day and full-date labels in common copy. Dropped from the prototype: "Already crossed? Sign in" (no accounts in Early Access) and the meal promotion note (not built yet).
- Edge cases: permissions refused (Settings and skip paths), sub-second recordings discarded, recording restores UI audio mode, re-record deletes the old file, failed arc save keeps the draft, no back-navigation into onboarding after finishing, corrupted drafts repaired on restore.
- Verified: 193 tests including the full onboarding flow through the real UI; no console warnings; Android bundle includes both migrations.

### 9 Oct 2026: Step 7, local database

- Added `drizzle-orm@0.45.4` (stable, chosen over the 1.0 release candidate for reliability), dev `drizzle-kit@0.31.11`, `babel-plugin-inline-import`, `better-sqlite3` (tests only).
- New config: `babel.config.js`, `metro.config.js`, `drizzle.config.ts`; script `db:generate`; `src/types/sql.d.ts`.
- `src/db/`: schema (arcs, arc_orders, order_logs, day_logs), first migration `0000_init`, client (expo-sqlite with change listener), repositories, `useDatabaseMigrations`, test database helper.
- `useTodayOrders` now persists: live queries for reads, one transaction per tap, stamp-shown flag per day.
- Start-up waits for migrations; `StartupError` screen if they fail. Today shows a notice if a save fails, and renders rows only after the first read.
- Jest: in-memory real SQLite with migrations, a test `useLiveQuery` that re-renders after writes, database cleared before each test.
- Verified: 167 tests (real SQL, including app-restart cases), no console warnings; Android bundle contains the migration SQL.

### 9 Oct 2026: Step 5, Today screen (in memory)

- `src/features/orders/` (types, targets, status rules, tested), `src/hooks/useTodayOrders.ts` (tested: rapid taps, stamp once per day, undo, notes, midnight), `formatClockTime` in dates.
- `src/components/today/`: `TaskRow`, `WorkoutSheet`, `StampOverlay`. Kit gained `TextField`.
- Veni rebuilt around the four orders; Today copy reorganised (progress lines in three tones and four stages, order lines, sheet, stamp). Two prototype Roast lines adjusted: one assumed an alarm time, one referenced squads.
- UX decisions: long-press undo on every row; workout sheet keeps the minimum/full rule; wake-up records the real time; no placeholder data for campaign, rank, step one, selfie or to-do.
- Verified: 155 tests, render tests drive the full Today flow, no console warnings; Android export bundles.

### 9 Oct 2026: Step 4, core UI kit

- Specs first in `docs/UI-KIT.md`, traced to prototype screens; only components with a known screen were built.
- Installed `react-native-svg`; dev: `@testing-library/react-native@13`, `react-test-renderer@19.2.3`.
- New tokens: colour `accentFill`; layout sizes for buttons, chips, ring, status circle, bars, sheet, stamp.
- New: 14 kit components, `src/lib/progress.ts` (clamping, segment normalising, rounding, tested), `src/theme/animation.ts`, `src/theme/ReduceMotionProvider.tsx`, `src/features/orders/types.ts` (`OrderKind`, `OrderStatus`), `src/dev/KitGallery.tsx` in the theme lab.
- Render tests added for all routes (entry, tabs, tab switching, selected state, tone change, theme lab in light mode). They caught: Jest transform gap for `standard-navigation`, Testing Library v14 incompatibility, and Reanimated mock gaps (resolved by the app-wide `useReduceMotion`).
- React Compiler lint caught setState inside an effect in BottomSheet; fixed with the render-time state adjustment pattern.
- Verified: `npm run check` clean, 126 tests, no console warnings in render tests; Android export bundles.

### 9 Oct 2026: Step 3, app shell, navigation and state

- Added `zustand` and `expo-sqlite` (config plugin added).
- `src/features/tone/`, `src/copy/` (common, tabs, today, progress, arc, toneLines), `src/stores/` (preferences, phoneStorage, preferencesStore), `src/lib/` (dates, toRoman), `src/hooks/useToday.ts`.
- Components: `Card`, `ScreenHeader`, `ToneLine`, `navigation/TabBar`; `Screen` gained scroll-to-top. New type variant `headingSmall` (Marcellus 17) for tab names.
- Routes: `(tabs)/_layout.tsx`, `veni.tsx`, `vidi.tsx`, `vici.tsx`; `index.tsx` now redirects to `/veni`; root layout feeds the store into `ThemeProvider`; theme lab gained tone switching.
- Edge-case pass on everything built so far: unregistered saved theme ids are now rejected on restore (previously caused a warning on every render); sound bank failure paths tested (load failure, silent cue, release, volume clamp); contrast tests extended to inset rows in both schemes.
- Verified: `npm run check` clean, 100+ tests; Android export bundles.
- Not yet verified on the phone.

### 9 Oct 2026: Step 2, foundation

- Wrote the rules: `.claude/CLAUDE.md` (rewritten, paths fixed to `src/app/` and `docs/v1-docs/`), `AGENTS.md` (points every agent to the same rules), `docs/CONVENTIONS.md`, `docs/DESIGN-SYSTEM.md`, this file. Rewrote `docs/v1-docs/BUILD-STEPS.md` into 15 detailed steps with a dated timeline.
- Installed: `@expo-google-fonts/marcellus`, `@expo-google-fonts/figtree`, `expo-haptics`, `expo-audio` (adds its config plugin); dev: `eslint`, `eslint-config-expo`, `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`, `jest`, `jest-expo`, `@types/jest`.
- Config: `eslint.config.js`, `.prettierrc`, `.prettierignore`, Jest preset in `package.json`, scripts (`check`, `typecheck`, `test`, `format`, `check:dashes`, `sounds`), removed the broken `reset-project` script, `tsconfig.json` (`noUncheckedIndexedAccess`, `types: ["jest"]` because TS 6 no longer auto-includes global types, alias order fixed).
- `app.json`: name Vinco, slug and scheme `vinco`, basalt (`#1D1A17`) splash, icon and root backgrounds.
- Built `src/theme/` (tokens, palettes, Vinco theme, registry, resolver, provider, feedback, contrast helper), `src/components/Txt.tsx`, `src/components/Screen.tsx`, `src/app/_layout.tsx`, `src/app/index.tsx` (temporary redirect), `src/app/dev/theme-lab.tsx`.
- Scripts: `scripts/generate-sounds.mjs`, `scripts/check-em-dash.mjs`.
- Verified: 37 tests pass (contrast in both schemes, theme completeness, resolver edge cases); typecheck and lint clean; lint rules proven on a deliberately bad file; Android export bundles with all 17 sounds and only the 5 used font weights.
- Not yet verified on the phone: run `npx expo start -c` and open the theme lab.
