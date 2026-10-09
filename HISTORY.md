# HISTORY.md: Vinco mobile project state

The memory of this project. Any AI model or developer joining should read this, then [.claude/CLAUDE.md](.claude/CLAUDE.md), and be able to continue. **Update after every feature milestone** (newest log entry on top; refresh the snapshot).

---

## Snapshot (as of 9 Oct 2026)

**Phase:** Early Access (tracker only, all on the phone, no backend). Closed-test build due **12 Oct 2026**, Early Access **2 Nov 2026**.

**Done:** Steps 1 to 5 and 7 to 11, plus Step 13's day card, own orders and the to-do list (daily and day tasks, carry-over), user-called Truces, "Sound the retreat" (journey reset), a persistent "Seal the day" card and dev mode. Every prototype screen in Early Access scope exists on real data except the to-do list and step one (Step 12).

**Next:** Step 12 (local nudges with a three-a-day cap, bedtime and the sleep chart, to-do list with carry-over, step one card), then Step 13 decorations and Step 14 hardening. Step 6 (first Play build) is blocked on the questions below.

**What runs today:** first launch opens onboarding (Rubicon, arc length, orders, tone, oath recording, first selfie with the DAY I stamp); finishing creates the arc in SQLite and opens Today, which shows "DAY I OF LX", the tuned orders (tap to add, long-press to undo, workout sheet, VINCO stamp once a day) and saves everything. Vidi shows stats, the arc calendar and timelapse progress. Today lists Vinco's four orders and the user's own (one tap: minimum, then full goal), an "Add an order" button, and a to-do tile that opens the to-do list (every-day tasks, today, tomorrow, carry over or drop). Vici has "Your orders" (stand an order down: it counts today, gone tomorrow). Once every order holds, a "Seal the day" card stays on Today (the stamp can be dismissed without losing the day card). Vici shows the journey, rank, denarii and working settings (tone, appearance, sounds, vibration, Truces in reserve, oath playback from Day X, "Sound the retreat"). A broken campaign opens the "campaign lost" screen once: if yesterday was missed and there was a campaign to save, it offers a Truce (from the reserve, or bought with denarii), otherwise Resurgo; Today keeps a Truce banner until the day ends. Dev builds: a "Dev mode" switch in Vici shows dev tools (simulated next day, hold or conquer today, theme lab, reset everything); long-pressing Vici still opens the theme lab.

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

| Date  | Decision                                                                                                                        | Why                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 9 Oct | Colour tokens named by role, not brand (`accent` not `gold`)                                                                    | Switching core themes must not leave misleading names                                       |
| 9 Oct | Light scheme (Marble) built now, dark stays default                                                                             | Theme switching is a stated requirement; contrast tests keep both readable                  |
| 9 Oct | `app.json` `userInterfaceStyle` stays `automatic`                                                                               | Lets `colorMode: 'system'` work; the app's own default is still dark                        |
| 9 Oct | Sounds generated as WAV from the prototype recipes                                                                              | Matches the design exactly; a new theme can ship its own set                                |
| 9 Oct | Fonts imported per weight from subpaths                                                                                         | Package index would bundle all 14 Figtree weights                                           |
| 9 Oct | Android package name **not** set yet                                                                                            | It becomes permanent on first Play upload; decide in Step 6                                 |
| 9 Oct | Play closed-test build moved to Step 6 (before the database)                                                                    | The 14-day closed test must start by 12 Oct to make 2 Nov                                   |
| 9 Oct | State: Zustand for app/UI state (persisted), SQLite + Drizzle live queries for records, never mirrored; TanStack Query from 1.0 | Developer's decision. One source of truth per kind of data                                  |
| 9 Oct | Zustand persisted to expo-sqlite kv-store with its sync API                                                                     | One storage engine for the app; synchronous restore means no flash of default theme or tone |
| 9 Oct | ThemeProvider made controlled (no internal copy of preferences)                                                                 | One source of truth: the store                                                              |
| 9 Oct | Custom tab bar instead of styling the default one                                                                               | The prototype's two-line Latin/plain labels don't fit the default label slot cleanly        |
| 9 Oct | Default tone before onboarding: Centurion                                                                                       | The app's core voice ("orders", "soldier"); onboarding sets the real choice                 |
| 9 Oct | Theme lab opened by long-pressing the Vici tab, dev only                                                                        | Keeps dev tools out of real screens                                                         |
| 9 Oct | Three kinds of to-do: orders (decide the day, min and full goal), daily tasks, day tasks (never affect sealing)                 | Developer's structure; spec in docs/ORDERS-AND-TASKS.md                                     |
| 9 Oct | Own orders: one tap per level (minimum, then full), max 4, start today, stand down from tomorrow                                | Keeps the core job one tap; removing an order can never rescue the day in progress          |
| 9 Oct | Day results stored at sealing (`day_logs.result`)                                                                               | Changing orders must never rewrite history                                                  |
| 9 Oct | Truces called by the user; earned (1 at arc start, 1 per 7-day campaign, max 3) or bought (50 denarii) when needed              | Developer's decision. A Truce is a choice and a reward, not a silent weekly pass            |
| 9 Oct | A Truce covers only the missed run ending yesterday, one Truce per missed day                                                   | Simple rule ("before the next day ends"); never rewrites history past sealed days           |
| 9 Oct | Journey reset wipes records, selfies and oath; keeps preferences. Confirmed by typing RETREAT                                   | Developer's request; typed word stops an accidental wipe                                    |
| 9 Oct | Dev mode: a persisted day offset in `useDevStore`, read by `useToday` (dev builds only), only ever moves forward                | Tests history and sealing on a real phone; going back would leave sealed future days        |

### Questions for the developer (parked while working)

Answer when convenient; work continues with the safe default shown.

1. **Package name and Play account** (needed for Step 6, target 12 Oct). Default: nothing set until you decide.
2. **App icon and splash art.** Default: Expo template images remain; Step 6 can't ship without real ones.
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

- Template leftovers not used by the app: `assets/images/react-logo*.png`, `expo-badge*.png`, `expo-logo.png`, `logo-glow.png`, `tutorial-web.png`, `tabIcons/`; packages `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `expo-device`. Remove when convenient (`expo-device` may be useful later).
- `docs/v1-reference/` (the plan HTML) still describes the weekly Truce; it's a reference snapshot, left as is. PLAN.md is updated.
- `npm audit` reports 30 advisories in the dependency tree (mostly dev tooling). Review before the production build.
- `README.md` is now a short project readme.

---

## Milestone log

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
