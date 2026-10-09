# Vinco build steps: Early Access

From an empty folder to Early Access on **2 November 2026**. Each step lists its goal, the work, how it's checked, and what to learn along the way. Tick boxes as you finish.

**Status:** Steps 1 to 5 and 7 to 11 done; Step 13's day card done. Step 6 (Play build) waits on the developer's decisions. Next: Step 12 (nudges, to-do, step one, bedtime) and Step 13's decorations.

**Every step ends with a checkpoint:**

1. `npm run check` passes (typecheck, lint, em-dash scan, tests).
2. Tried on the phone in Expo Go: `npx expo start -c`.
3. [HISTORY.md](../../HISTORY.md) updated.
4. The developer commits (Claude suggests a message, never runs git).

**Rules for every step:** [CONVENTIONS.md](../CONVENTIONS.md). **Design:** [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md). **Product:** [PLAN.md](PLAN.md). **Screens:** `docs/v1-reference/Vinco app UI.html` (18 screens).

---

## Timeline

| Dates           | Steps      | Milestone                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| 9 to 12 Oct     | 3, 4, 5, 6 | **First build uploaded to Play closed testing (12 Oct)**, 12+ testers opted in |
| 13 to 20 Oct    | 7, 8, 9    | Data survives restarts, onboarding, campaign rules                             |
| 21 to 27 Oct    | 10, 11, 12 | Proof, Vidi, Vici, nudges, to-do                                               |
| 28 Oct to 1 Nov | 13, 14     | Day card, honours, hardening, production build                                 |
| 2 Nov           | 15         | **Early Access** (closed test passed 26 Oct)                                   |

> **The real critical path is not code.** Google requires a new personal developer account to run a closed test with 12+ testers for 14 days before going public. Starting on 12 October ends on 26 October, leaving one week for production review before 2 November. That needs, before 12 October: a Play Console account (identity verification can take days), the final package name, an app icon, a privacy policy URL and 12+ testers' Gmail addresses. Start these today, in parallel with Steps 3 to 5. Updated builds can be uploaded during the test, so the first build only needs to install and run.

---

## Step 1: Project setup ✅

- [x] Node 22 and Git installed
- [x] `vinco-mobile` repo created on GitHub
- [x] Expo app created and example screens cleared
- [x] App runs on the phone in Expo Go

---

## Step 2: Foundation: rules, tooling, design system ✅

**Goal:** every screen built after this looks right, sounds right and follows the same rules.

- [x] Rules: `.claude/CLAUDE.md`, `AGENTS.md`, `docs/CONVENTIONS.md`, `HISTORY.md`
- [x] Tooling: ESLint (Expo config, Prettier, project rules), Prettier, Jest (`jest-expo`), TypeScript strict with `noUncheckedIndexedAccess`
- [x] `npm run check` = typecheck + lint + em-dash scan + tests
- [x] Lint rules for the design system: no raw `Text`, no hard-coded colours, no em-dashes, named exports, naming conventions, `@/theme` public API only
- [x] Packages: Marcellus and Figtree fonts, `expo-haptics`, `expo-audio`
- [x] Theme system in `src/theme/`: colour roles, Basalt (dark) and Marble (light) schemes, type scale, spacing, radius, layout, motion, switchable core themes
- [x] Feedback cues: 17 UI sounds generated from the prototype's recipes, a haptic per cue, user switches for sound and haptics
- [x] Tests: contrast for every scheme, theme completeness, scheme resolution
- [x] `Txt` and `Screen` components; root layout loads fonts behind the splash and falls back safely if they fail
- [x] `app.json`: name Vinco, slug and scheme `vinco`, basalt splash and icon background
- [x] Dev theme lab at `/dev/theme-lab`: every text style, colour role and feedback cue, with dark, light and system switching

> **Learn:** `useFonts` loads font files before first paint. `SplashScreen.preventAutoHideAsync()` keeps the splash up meanwhile. On Android, custom fonts ignore `fontWeight`, so each weight is its own family name.

---

## Step 3: App shell and navigation ✅

**Goal:** the app opens to the Veni, Vidi and Vici tabs, in theme, with the shared pieces every screen needs.

### 3.1 Tone, copy and state

- [x] `Tone` in `src/features/tone/`: `TONES`, `isTone`, `DEFAULT_TONE` (Centurion until onboarding sets it)
- [x] `src/copy/`: one file per area (`common`, `tabs`, `today`, `progress`, `arc`), `ToneLines` + `pickTone`, weekday names and "days left" wording (0, 1, many)
- [x] `src/stores/`: Zustand `usePreferencesStore` (tone, theme, colour mode, sound, haptics), persisted with expo-sqlite kv-store, restored synchronously (no flash), validated on restore, versioned
- [x] `ThemeProvider` made controlled and fed from the store in the root layout

### 3.2 Helpers

- [x] `src/lib/toRoman.ts`: 1 to 3999, throws `RangeError` otherwise
- [x] `src/lib/dates.ts`: `toDayKey`, `parseDayKey` (rejects impossible dates), `daysBetween`, `addDays`, `daysLeftInYear`, `dayOfArc`, `weekdayIndex`, `msUntilNextLocalMidnight`; tested across month and year ends, leap days and daylight saving
- [x] `src/hooks/useToday.ts`: today's day key, updated at midnight and on returning to the app

### 3.3 Tabs

- [x] `src/app/(tabs)/_layout.tsx` with a custom `TabBar` (`src/components/navigation/TabBar.tsx`): Latin (`headingSmall`) over plain label (`micro`), accent on the active tab, 76 + bottom inset, hairline top border
- [x] `toggle` cue only when switching; re-tapping the active tab scrolls to the top (`useScrollToTop` in `Screen`)
- [x] Accessibility: `tablist` / `tab` roles, selected state, "Veni, Today" labels; font scale capped so labels fit
- [x] Only known tab routes render, so a stray file can't break the bar

### 3.4 Tab screens

- [x] `ScreenHeader` (eyebrow, title as accessibility header, caption, optional right accessory), `Card` (surface, sunk, raised, optional border), `ToneLine` (message in the user's tone with the tone named)
- [x] Veni: real weekday and days left in the year, empty-state tone line
- [x] Vidi and Vici: prototype headers and empty-state tone lines

### 3.5 Entry

- [x] `src/app/index.tsx` redirects to `/veni` (onboarding check in Step 8)
- [x] Theme lab in development: long-press the Vici tab. It also switches tone

**Done when:** three tabs on the phone, Marcellus over Figtree labels, accent on the active tab, and light mode or a tone change in the theme lab re-themes the tabs and survives an app restart.

> **Learn:** route groups like `(tabs)` organise files without adding to the URL. A custom `tabBar` replaces React Navigation's default bar but keeps its events, so behaviour like scroll-to-top still works.

---

## Step 4: Core UI kit ✅

**Goal:** the components the Early Access screens need, each specced against the prototype before it was built, each shown in every state in the theme lab.

- [x] Specs written first: [docs/UI-KIT.md](../UI-KIT.md)
- [x] `react-native-svg` installed
- [x] **Icon** (15 prototype line icons), **Laurel**, **StampMark**
- [x] **Button** (primary, secondary, ghost; 56, 48, 64 with sublabel; disabled, loading; 500 ms double-tap guard), **IconButton**
- [x] **StatChip**, **ChoiceChip**, **SectionHeader**
- [x] **ProgressBar** (continuous and segmented, animated, clamped), **ProgressRing** (animated SVG arc), **StatusCircle** (none, min, full; pops on change only)
- [x] **OptionCard** (radio semantics, pop on select), **Stepper** (rounding, limits with `denied`, TalkBack adjustable), **BottomSheet** (animated in and out, back button, keyboard, modal for screen readers)
- [x] `useReduceMotion()` from `@/theme`: one listener for the phone's reduce-motion setting; every animation honours it
- [x] `themeEasing` / `themeTiming` map motion tokens to Reanimated
- [x] Dev kit gallery (`src/dev/KitGallery.tsx`) inside the theme lab, interactive
- [x] Render tests mount the real app and the full theme lab

**Done when:** every component appears in the theme lab in all states, in both schemes, at the largest font size, with no overlap. (Code and render tests done; the visual pass on the phone is the developer's check.)

---

## Step 5: Today screen (local state) ✅

**Goal:** tick the four orders on Veni, see minimum versus full goal, and get the VINCO stamp. In memory for now; Step 7 saves it.

### 5.1 Logic: `src/features/orders/`

- [x] `ORDER_KINDS`, `OrderTarget` (min, full, step), `DEFAULT_ORDER_TARGETS` (water 1/4 L, wake 1, meals 1/2, workout 15/40 min)
- [x] `getOrderStatus`, `addStep` (caps at full), `removeStep` (floors at 0), `clampAmount`, `countOrdersHeld`, `areAllOrdersHeld`, `areAllOrdersConquered`; tested
- [x] `useTodayOrders` hook: rapid taps never lost, stamp once per day (even after undo and redo), wake time recorded, workout note trimmed to 80, fresh day at midnight; tested

### 5.2 UI

- [x] Header with weekday, days left in the year and the animated orders ring
- [x] Tone line that follows progress (three tones, four stages)
- [x] `TaskRow` (`src/components/today/`): status circle, line, water segments, inline action; **tap adds, long-press undoes**
- [x] Wake-up: "I'm up" records the real time (no fake "done": Aurora is 1.0)
- [x] `WorkoutSheet`: Hold the line (15 min) or Conquer (40 min), optional typed note (voice arrives with the Step 8 recorder)
- [x] `StampOverlay`: slam, falling laurel leaves, rising text, `stamp` sound and heavy haptic on impact; static with reduced motion
- [x] Cues: `tap` progress, `win` full goal, `stepDown` undo, `denied` when a tap can't do anything
- [x] Not shown until real data exists: campaign, Truce and rank chips (Step 9), step one (Step 12), selfie and to-do tiles (Steps 10, 12)
- [x] `TextField` added to the kit (workout note; later weight and step one)
- [x] Render tests drive the real UI: tap and undo water, log a workout through the sheet, all four held shows the stamp

---

## Step 6: First closed-test build (target 12 Oct)

**Goal:** an installable Android build in Google Play closed testing, with 12+ testers opted in, so the 14-day clock starts.

- [ ] **Decide:** studio name and the final Android package name (permanent after first upload), Play account (new personal account needs the closed test; an older one may not)
- [ ] App icon and adaptive icon (laurel on basalt), splash image; replace the Expo template images
- [ ] `app.json`: `android.package`, `version`, `android.versionCode`
- [ ] Expo account; `npx eas-cli@latest login`; `npx eas-cli@latest build:configure`
- [ ] `eas.json` profiles: `development`, `preview` (APK for your phone), `production` (AAB for Play)
- [ ] `npx eas-cli@latest build -p android --profile preview`: install the APK on your phone and test
- [ ] Privacy policy page (selfies never leave the phone; no account; no tracking in Early Access)
- [ ] Play Console: create the app, content rating (adults), data safety form, closed testing track, testers list
- [ ] `npx eas-cli@latest build -p android --profile production`, then `npx eas-cli@latest submit -p android` (or upload the AAB by hand the first time)
- [ ] Share the opt-in link; confirm 12+ testers have opted in

> **Learn:** an APK installs directly on your phone; an AAB is what Play wants. EAS stores your signing key: never lose access to that Expo account. Each Play upload needs a higher `versionCode`.

---

## Step 7: Local database ✅

**Goal:** progress survives closing the app.

- [x] `expo-sqlite` + **Drizzle ORM 0.45 (stable)** + `drizzle-kit` 0.31; `babel.config.js` inlines `.sql`, `metro.config.js` adds the `sql` extension, `drizzle.config.ts`
- [x] Schema (`src/db/schema.ts`): `arcs`, `arc_orders`, `order_logs` (day + kind), `day_logs` (wake time, stamp shown, sealed, Truce). Ledger arrives in Step 9, to-dos and step one in Step 12, each as its own migration
- [x] Migrations generated with `npm run db:generate` into `src/db/migrations/`, run at start-up by `useDatabaseMigrations`; the splash waits for them
- [x] Repository functions take the database as a parameter (`orderLogs.ts`, `dayLogs.ts`), so they run on the phone and in tests unchanged
- [x] `useTodayOrders` reads with Drizzle live queries and writes one transaction per tap (fresh read first, so rapid taps never race); the stamp-shown flag is stored per day, so a restart never replays it
- [x] Edge cases: failed migration shows a calm recovery screen (`StartupError`) and keeps data; a failed save shows a notice on Today and keeps the last good value; rows render only after the first read, so nothing pops on open
- [x] Tests run real SQL: an in-memory better-sqlite3 database with the real migrations (`src/db/testing/testDatabase.ts`), cleared before every test; repository, hook (including app restart) and screen tests
- [ ] Theme preferences are in the Zustand store (persisted), not SQLite: decided in Step 3

> **Learn:** SQLite is a real database in a file on the phone. A migration is a numbered SQL change applied once, in order, so every phone ends up with the same tables, whatever version it updated from.

---

## Step 8: Onboarding ✅

**Goal:** a new user goes from Cross the Rubicon to Day I in under two minutes.

- [x] Rubicon: rotating Stoic quotes (tap to skip, still with reduced motion), flowing river, two-line button with the `cross` cue
- [x] I of V, arc length: 30 / 60 / 90 option cards, "Most chosen" on 60, today and the real end date, a quip per choice
- [x] II of V, orders: four locked orders; fixed minimums beside steppers for full goals (water 2 to 5 L in halves, meals 1 to 3, workout 20 to 90 min) and the wake-up time (4:00 to 9:00 in 15 min)
- [x] III of V, tone: two scenes, a live typing preview, three tone cards; the choice is saved straight to preferences
- [x] IV of V, oath: microphone asked on tap, 20 s limit, live waveform from the mic level, wax seal, record again (old file deleted), Settings link if refused, skip
- [x] V of V, selfie: front camera (kept dark in light mode), face outline, DAY I stamp slam with the `seal` cue, Horace quote; camera permission paths; start without a selfie
- [x] Draft in a persisted Zustand store (validated on restore); reopening the app resumes at the last step; Back works without history
- [x] Finishing writes the arc, its four orders and the first selfie in one transaction, clears the draft, opens Today with no way back into onboarding; a failed save keeps the draft and says so
- [x] `src/app/index.tsx`: active arc goes to Today; otherwise onboarding at the last step
- [x] Today reads the arc: tuned targets, "DAY XII OF LX", "Day XII conquered"
- [x] Migration `0001`: `arcs.wake_time`, `arcs.oath_path`, `day_logs.selfie_path`
- [x] Media saved in the app's private folder (`src/media/`), never uploaded
- [x] Render test drives the whole flow; resume and skip-onboarding cases tested
- [ ] Bedtime: asked in Step 12 with the wind-down nudge that uses it
- [ ] Step one: a card on Today in Step 12

---

## Step 9: Campaign engine ✅

**Goal:** the rules that make a streak trustworthy, as pure functions with tests.

- [x] `src/features/campaign/`: day results (conquered, held, truce, missed), current and best campaign, completed days, Resurgo days, weeks starting Monday, one Truce per week
- [x] Ranks by completed days (Tiro 1, Miles 4, Optio 10, Centurion 20, Tribune 35, Legate 50, Consul 60; Caesar only for finishing a 90-day arc), thresholds in one config
- [x] Denarii: 5 held, 10 conquered, +25 every 7 days of campaign; `ledger` table keyed by (day, reason) so nothing is paid twice (migration `0002`)
- [x] Sealing (`src/db/sealing.ts`): seals every finished, unsealed day of the arc in one transaction, including days the app was closed; a missed day takes the week's Truce automatically if free; never re-seals; stops at the arc's end
- [x] `useSealFinishedDays` runs on open and at midnight (tabs layout); `useCampaign` computes everything live from the rows
- [x] Today shows "Campaign N", Truce status and rank once real data exists
- [x] Tests: engine (week boundaries, gaps, breaks, rank edges, bonus), sealing on real SQL (catch-up, Truce per week, idempotent, arc end, clock before arc), and a render test from rows to chips

---

## Step 10: Proof and Vidi ✅ (sleep chart waits for bedtime, Step 12)

- [x] Stat row: campaign, full-goal days (conquered over days so far), days to go
- [x] Arc calendar, Monday first: conquered, line held, Truce, missed, today ringed, future dimmed; month navigation limited to the arc; every cell labelled for screen readers (`monthGrid`, `shiftMonth` tested)
- [x] Timelapse progress from real saved selfies (30 needed, `TIMELAPSE_SELFIES`)
- [x] Empty state in the user's tone before onboarding
- [x] Left out on purpose: the Calendar / Reels / Sleep switcher (Reels is 1.0; sleep needs bedtime from Step 12)
- [x] Daily selfie (`/selfie`, kept dark): yesterday's real photo as the ghost (Off / Faint / Strong), flip camera, retake, "Day XII saved" with timelapse frames, recent strip, optional weight in kg (validated, comma decimals accepted; migration `0003`); Today tile shows taken or not
- [x] `SelfieCapture` shared by onboarding (with the DAY I stamp) and the daily selfie (with the ghost)
- [ ] Sleep chart (with bedtime, Step 12)

## Step 11: Vici and settings ✅

- [x] Arc name, dates and "Day XII of LX"; journey line with Roman milestones (`getArcMilestones`) and today's marker
- [x] Rank card: medallion, meaning, days to next rank with progress, denarii earned
- [x] Settings: tone and appearance (sheets), sounds and vibration (switches), Truce this week, the oath (sealed until Day X, then Listen; plays even on silent because the user asked, then restores UI audio)
- [x] Campaign lost screen (`/campaign-lost`): shown once per break (`findLatestLoss`, `useNoticesStore`), toppling column, tone line, "Rise again" to the comeback ("Day I, again") with the `rise` cue
- [x] Render tests: arc and rank from sealed days, settings sheets and switches, the loss flow shown exactly once

---

## Step 12: Nudges, to-do, step one

- [ ] `expo-notifications`, local only; permission asked when first needed
- [ ] Scheduler: morning brief, evening check (only if something's open), wind-down; at most three a day (tested)
- [ ] To-do list with "carry over or drop?" the next morning
- [ ] Step one templates and the Armory list

## Step 13: Day card and honours

- [x] Day card (`/day-card`, opened by "Seal the day"): laurel, DAY XII OF LX, the day number, today's real order values, campaign and rank, in three styles (`DAY_CARD_STYLES` in the theme; Marble's gold deepened for contrast); "Share to story" captures the card (`react-native-view-shot`) and opens the share sheet (`expo-sharing`), with toasts for done, unavailable and failed. The prototype's reel count is left out (1.0)
- [ ] Starting decorations; denarii shown on Vici (earning only, no shop in Early Access)

## Step 14: Hardening and release

- [ ] Error boundary with a calm recovery screen; no raw errors shown
- [ ] Accessibility pass: TalkBack labels, largest font, contrast, 44 by 44 targets
- [ ] Test on a low-end Android phone and a Xiaomi, Oppo, Vivo or Realme phone
- [ ] Remove or hide dev-only routes in production
- [ ] Production build, store listing, screenshots, closed-test feedback addressed

## Step 15: Early Access, 2 November

- [ ] Promote to production after the 14-day closed test
- [ ] Monitor crashes and feedback; plan Vinco 1.0

---

## Concepts cheat sheet

| Concept           | In one line                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Expo Go           | A ready-made app that runs your JavaScript, for fast development. Can't load custom native code |
| Development build | Your own version of Expo Go with your native code inside. Needed for the Vigil (1.0)            |
| Metro             | React Native's bundler, like Vite for web                                                       |
| Safe area         | The part of the screen not covered by the notch, status bar or gesture bar                      |
| Native module     | Kotlin code that JavaScript can call, for alarms and the Vigil                                  |
| Permission        | The user's approval for camera, mic or notifications, asked when first needed                   |
| APK / AAB         | Installable test file / the file Play wants                                                     |
| Package name      | The app's permanent Android ID, like `com.studio.vinco`                                         |
| Signing key       | Proves updates come from you. EAS stores it; never lose it                                      |
| EAS Update        | Sends JavaScript fixes to installed apps without a Play review                                  |
| Play tracks       | Internal, closed (testers), open, production                                                    |
