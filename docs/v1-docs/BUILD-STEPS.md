# Vinco build steps: Early Access

From an empty folder to Early Access on **2 November 2026**. Each step lists its goal, the work, how it's checked, and what to learn along the way. Tick boxes as you finish.

**Status:** Steps 1 and 2 done. Next: Step 3 (app shell and navigation).

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

## Step 3: App shell and navigation

**Goal:** the app opens to the Veni, Vidi and Vici tabs, in theme, with the shared pieces every screen needs.

### 3.1 Copy system: `src/copy/`

- [ ] `Tone` type: `'philosopher' | 'centurion' | 'roast'`
- [ ] One file per area (`common.ts`, `tabs.ts`, `today.ts` ...), exported through `src/copy/index.ts`
- [ ] Lines that vary by tone are `Record<Tone, string>`; a helper `pickTone(lines, tone)` returns one
- [ ] Humour rule check: every Roast line ends with a way forward; selfie, weight and slip lines are neutral in all tones

### 3.2 Helpers: `src/lib/`

- [ ] `toRoman(n)`: 1 to 3999, throws on 0, negatives and non-integers (tests for I, IV, IX, XII, XL, LX, XC, CD, MMMCMXCIX)
- [ ] Dates: `toDayKey(date)` ('YYYY-MM-DD' in local time), `daysLeftInYear(date)`, `dayNumberInArc(start, today)` (tests across month ends, leap years, daylight saving)

### 3.3 Tabs: `src/app/(tabs)/_layout.tsx`

- [ ] Expo Router JS `Tabs`, no icons, custom `TabLabel`: Latin word in Marcellus over the plain label; active label in accent
- [ ] Tab bar height `layout.tabBarHeight` plus the bottom safe area; `border` top line; `background` fill
- [ ] `toggle` cue on tab change
- [ ] Accessibility label reads "Veni, Today" etc.

### 3.4 Tab screens: `veni.tsx`, `vidi.tsx`, `vici.tsx`

- [ ] Each uses `Screen` and the real header pattern (eyebrow + title + caption) from the prototype, with copy from `src/copy/`
- [ ] Empty-state copy in three tones

### 3.5 Entry

- [ ] `src/app/index.tsx` redirects to `/veni` (onboarding check comes in Step 8)
- [ ] Theme lab stays reachable in development at `/dev/theme-lab`

**Done when:** three tabs on the phone, Marcellus over Figtree labels, accent on the active tab, light mode in the theme lab also re-themes the tabs.

> **Learn:** route groups like `(tabs)` organise files without adding to the URL. Expo Router turns each file in `src/app/` into a screen.

---

## Step 4: Core UI kit (planned, then built)

**Goal:** the components the Early Access screens need, each specced against the prototype before it's built (CONVENTIONS section 7), each shown in every state in the theme lab.

- [ ] Install `react-native-svg` (icons, laurel, rings) with `npx expo install`
- [ ] **Icons:** one `Icon` component with the prototype's line icons (water, sunrise, bowl, dumbbell, flame, camera, list, lock, back, close, mic, check, flip). 1.8 stroke, `currentColor`
- [ ] **Brand marks:** `Laurel` (the wreath SVG), `VincoStamp` (porphyry bordered wordmark)
- [ ] **Button:** primary (accent pill), secondary (outlined), ghost; 56 and 48 heights; pressed, disabled, loading; plays a cue
- [ ] **IconButton:** 44 by 44 hit area (back, close)
- [ ] **Card:** surface, sunk, raised; optional border; padding `cardPadding`
- [ ] **Chip:** stat chip ("Campaign 11"), filter chip (selectable)
- [ ] **SectionHeader:** overline text with spacing
- [ ] **ProgressBar:** continuous and segmented (water's 4 segments, onboarding I of V)
- [ ] **ProgressRing:** orders done out of 4, animated
- [ ] **StatusCircle:** empty, minimum (soft fill), full (check), with the pop animation
- [ ] **OptionCard:** selectable card for arc length and tone
- [ ] **Stepper:** - value + with limits and step size
- [ ] **SegmentedControl:** Calendar / Reels / Sleep style
- [ ] **BottomSheet:** scrim, slide-up, close on scrim tap and back button
- [ ] **Toast:** inverse pill, auto-hide
- [ ] Reduced motion: every animation has a still fallback

**Done when:** every component appears in the theme lab in all states, in both schemes, at the largest font size, with no overlap.

> **Learn:** `Pressable` is React Native's button; `react-native-reanimated` runs animations on the UI thread so they stay smooth.

---

## Step 5: Today screen (local state)

**Goal:** tick the four orders on Veni, see minimum versus full goal, and get the VINCO stamp. React state only, no database yet.

### 5.1 Logic first: `src/features/orders/`

- [ ] Types: `OrderKind` (`water`, `wake`, `meal`, `workout`), `OrderTarget` (min, full, unit, step), `OrderProgress`
- [ ] `getOrderStatus(progress, target)` returns `'none' | 'min' | 'full'`
- [ ] `addProgress(progress, target)` caps at full, ignores taps past full
- [ ] `countOrdersHeld(day)`, `areAllOrdersHeld(day)`
- [ ] Tests: zero, exact minimum, exact full, past full, half-litre steps

### 5.2 UI

- [ ] Header: eyebrow "DAY XII OF LX", weekday title, days left in the year, ProgressRing
- [ ] Chips: campaign, Truce status, rank
- [ ] Tone line that changes with progress (copy in three tones)
- [ ] `TaskRow`: StatusCircle, name, sub-line, water's 4-segment bar, inline action ("+1 L", "+1", "Log")
- [ ] Wake-up shown as done (Aurora alarm is a 1.0 feature; Early Access uses a normal reminder)
- [ ] Workout: tap opens a sheet with a typed note now (voice note in Step 8 with the oath recorder)
- [ ] Step one card (template text for now), selfie tile, to-do tile (placeholders until Steps 10 and 12)
- [ ] Cues: `tap` on each tap, `win` at full goal, `stamp` when all four reach the minimum
- [ ] The VINCO stamp overlay: slam animation, falling laurel leaves, "Seal the day" and "Back to Today"; shown once per day

**Done when:** tapping through all four orders on the phone triggers the stamp once, with sound and haptic, and nothing double-fires on fast taps.

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

## Step 7: Local database

**Goal:** progress survives closing the app.

- [ ] `npx expo install expo-sqlite`
- [ ] `src/db/`: schema for `arcs`, `tasks`, `task_logs`, `day_logs`, `todos`, `step_one`, `ledger`, `settings`
- [ ] Migrations: a version number in the database, each migration runs once, in a transaction
- [ ] Repository functions per table; features call them, screens never touch SQL
- [ ] Today screen reads and writes through `src/features/` and `src/db/`
- [ ] Theme preferences saved in `settings`, passed to `ThemeProvider` (`initialPreferences`, `onPreferencesChange`)
- [ ] Splash stays up until the database is open and migrated
- [ ] Edge cases: first launch, failed migration (keep data, show a recovery message), corrupted values (fall back to defaults)

> **Learn:** SQLite is a real database in a file on the phone. For Early Access the phone is the source of truth; the server comes in 1.0.

---

## Step 8: Onboarding

**Goal:** a new user goes from Cross the Rubicon to Day I in under two minutes.

- [ ] Rubicon screen: rotating Stoic quotes (tap to skip), flowing river line, pulsing primary button, `cross` cue
- [ ] Arc length: 30, 60, 90 as OptionCards, "Most chosen" on 60, end date and tone-free quip
- [ ] Your orders: four locked orders, minimum fixed, full goal adjustable with Steppers within limits
- [ ] Wake and sleep times (plan item missing from the prototype's I of V indicator: decide its place)
- [ ] Step one (optional): goal and a first 15-minute step from templates
- [ ] Tone picker with the live typing preview in two scenes
- [ ] The oath: 20-second recording with `expo-audio` (microphone permission asked here, with a reason), wax-seal animation, "Skip for now"
- [ ] First selfie with `expo-camera`, saved to the app's private folder, DAY I stamp, `seal` cue
- [ ] `src/app/index.tsx`: onboarding until finished, then Veni
- [ ] Edge cases: back navigation keeps choices, app killed mid-onboarding resumes, permission denied paths

---

## Step 9: Campaign engine

**Goal:** the rules that make a streak trustworthy, as pure functions with tests.

- [ ] Day seals at local midnight; catch-up sealing for days the app wasn't opened
- [ ] Campaign counting: minimum keeps it alive, full goal earns the laurel
- [ ] One free Truce per week (decide the week start), auto-applied or offered on a miss
- [ ] Resurgo within 24 hours of a broken campaign
- [ ] Ranks by days completed (thresholds in one config, to tune with Early Access data)
- [ ] Denarii earned into the local ledger (5 minimum, 10 full, 25 per 7 days of campaign)
- [ ] Tests: time zone change, daylight saving, clock moved back, missed several days, Truce on week boundary

---

## Step 10: Proof and Vidi

- [ ] Daily selfie with yesterday's ghost outline and opacity slider, 3-second timer, `shutter` cue; optional weight
- [ ] Selfie strip and timelapse progress (12 of 30)
- [ ] Vidi tab: stats row, calendar (conquered, line held, Truce), sleep chart from wake and bed times
- [ ] Camera screens wrapped in `SchemeOverride scheme="dark"`

## Step 11: Vici and settings

- [ ] Arc progress with Roman milestones, rank card with progress to next rank
- [ ] Settings: tone, colour mode, sound, haptics, oath status, Truce this week
- [ ] Oath playback on Day 10
- [ ] Campaign lost screen: broken column, tone line, "Rise again" (`rise` cue) or "Use this week's Truce" (`truce` cue)

## Step 12: Nudges, to-do, step one

- [ ] `expo-notifications`, local only; permission asked when first needed
- [ ] Scheduler: morning brief, evening check (only if something's open), wind-down; at most three a day (tested)
- [ ] To-do list with "carry over or drop?" the next morning
- [ ] Step one templates and the Armory list

## Step 13: Day card and honours

- [ ] Day card in three styles (Basalt, Marble, Porphyry), share to story, `confirm` cue
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
