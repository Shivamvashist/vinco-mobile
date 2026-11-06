# Today redesign, motion and Focus (Acies) (31 Oct 2026)

The developer's brief:

- A hero component above the orders, taking the reference shot (a dark running dashboard) as a mood, not a template.
- An Apple-like feel with spring micro-motion.
- A Focus button that springs open into a focus view: pick a time, pick a guard, run the timer, earn a reward.

Logged in [releases/v1.1.0.md](releases/v1.1.0.md).

## 1. What we take from the reference, and what we don't

| Take                                                      | Leave                                    |
| --------------------------------------------------------- | ---------------------------------------- |
| One big number as the hero, a light that rises from below | Dot-matrix digits (that's their brand)   |
| Small tiles with a tinted glow behind one fact each       | Fitness colours (magenta, orange, blue)  |
| A path across the hero that shows time passing            | A decorative sine wave                   |
| One dark CTA row with a round button and a status dot     | "GPS ready": ours says what Focus guards |

Vinco's version speaks Vinco: the hero number is **the day**, not a metric. The light is the palette's accent, so every palette (gold, verdigris, imperial purple) gets its own glow. Roman numerals stay decoration.

## 2. Today, top to bottom (rebuilt 1 Nov, night)

Four things and nothing else: the header, one hero, two tiles, one Orders and Tasks section. Every element says one thing; screen readers still get the full sentence.

1. **Header** (shared above all tabs, `TabsHeader`): the arc's day and the weekday on the left, the HUD counters and the user button on the right.
2. **One hero slot.** It shows exactly one card:
   - **The dawn card** until wake-up is logged (same size and shape as the Dies card, so the swap reads as one card changing face): a pill with the planned wake time, the greeting, "I'm up", and a quiet "Feeling sick today" in a campaign.
   - **The Dies card** after that, 236 pt tall (`layout.heroCardHeight`), corners `radius.xl`:
     - **Top row:** the state pill only: "Open", "Held", "Conquered", "Sick day" or "Arc complete". On a sick day "I'm feeling better" sits at the top right.
     - **Two faces in the centre:** the order count ("3" and a small "/5") for 6 seconds after the card shows and after each return to the tab (`useHeroFace`), then a cross-fade to the sky: a sun (6 am to 7 pm) or a moon riding the day path at now, with the time left in the day. No caption. Reduce motion swaps at once.
     - **The day path** with the day's activity marks (below), and the glow from the bottom (dim while open, warmer held, full conquered).
     - **Tap:** the Today summary sheet (`TodaySummarySheet`): orders held, denarii today and the run as three numbers, the day's timeline, and "Seal the day" (the day card) once today holds. The run opens the run pay sheet.
   - **The Aurora invite** (2 Nov), under the Dies card only while Aurora (the alarm) was never set up, in the Vinco build: one line and "Set up" open the guided setup (`/aurora-setup`), the cross is "Not now" for good. Never at dawn, on a sick day or once the arc is complete. See [GUARDIANS.md](GUARDIANS.md), "Setting up Aurora".
3. **Two tiles** side by side (stacked when the width over the font scale is under 340):
   - **Reels:** today's count "of" the budget and a thin bar (info, accent from 80 % of the budget, danger past it). "Set up" where reels can't be counted. Tap: `/reels`.
   - **Focus:** "Ready", or the time left while a focus runs, with the play button seated in the socket cut. Tap: the focus screen (section 4).
4. **Notices**, only when they apply: the Truce offer (a missed day breaks the campaign unless a Truce is called), the finished arc, a save error.
5. **Orders | Tasks**, one switch over one list:
   - **Orders:** the order rows (done ones sink), then "Add an order", or the water suggestion when free training has no orders.
   - **Tasks:** the to-dos, "Add to your day", then the daily logs as rows (selfie, weight, calories). They never affect sealing.

Before dawn the orders wait. Quests (labours in code) live in the Shop's Earn tab; the stamp overlay and every sheet are unchanged.

### Day activity timeline (the marks on the day path, 1 Nov)

**What counts, and where its time comes from** (`collectDayActivity` in `features/dayPath`, read by `hooks/useDayActivity`):

| Activity                                                | Time                                               | Source                                                          |
| ------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| Each order step (water taps, meal, workout, own orders) | When the amount rose                               | **New** `order_steps` table (migration 0013), one row per rise  |
| Wake-up                                                 | The wake time the user confirmed                   | `day_logs.woke_at` (the wake step itself is not drawn twice)    |
| A to-do done                                            | When it was ticked                                 | `task_completions.done_at`                                      |
| A focus                                                 | A stretch from start to end (to now while it runs) | `focus_sessions.started_at`, `ended_at`                         |
| Selfie, weight, calories                                | When last logged                                   | **New** `day_logs.selfie_at`, `weight_at`, `calories_at` (0013) |
| A reward claimed                                        | When claimed                                       | `claims.claimed_at`                                             |
| A Truce called                                          | When called; one mark per call                     | `truces.created_at` of the `spent` rows                         |

- **Order steps:** `saveOrderAmount` and `saveCustomOrderAmount` keep `order_steps` in line with the amount inside the same write: a rise adds a step (with the amount reached), a fall (undo) deletes the steps above the new amount. Own orders use the key `own:<id>`; deleting an own order deletes its steps; resetting the journey clears them.
- **Proof times:** `updateDayLog` stamps `selfie_at`, `weight_at`, `calories_at` when the value is set and clears them when it is cleared.
- **Rows from before 0013:** an order with an amount but no steps gets one mark at its log's `updated_at` (derived). Proof logged before 0013 has no time and gets no mark.
- **Truces:** a sick day counts on its own day. A Truce on missed days counts when it was called today by the real clock (rows for the last week sharing a `created_at` are one call). Under the dev clock such a call shows on the real day only.
- Ledger rows (pay for holding, run pay) are not activities: they follow the orders, not the user.

**Placement** (`placeOnPath`): by the time of day only (local clock now), from the day's start (the wake time, else the planned wake time, else midnight in free training with no wake order) to midnight. So the dev clock (whole days ahead) and a time zone change move the marks and the now dot together.

- **Before the start:** anything earlier than the day's start (a to-do before dawn, a step after midnight under a late day key) **sits at the start**. Chosen over stretching the path back to the earliest activity: the left edge stays the wake time, the now dot never jumps because an early tick came in, and such activity is rare and merges into one dot at the edge.
- **Clustering** (`clusterPathPoints`): walking left to right, a dot takes every mark within 7 pt of its **first** mark (3 pt radius, so marks closer than a dot's width merge), so a run of close marks never chains across the path. The merged dot sits at its members' mean, takes the colour most of them share (ties: orders, focus, logs) and grows a quarter per doubling of its count, three doublings at most. A hundred water taps become a handful of dots.
- **Colours** (three at most): orders and wake-up `accent`, focus `info`, everything else `textMuted`. A focus held is a solid `info` stretch, a running one is lighter, a retreated one is a faint dotted stretch.

**Motion and cost:**

- One SVG. Dots are drawn as one path per colour (`lib/dayPathGeometry.ts` `dotsPath`, a worklet), not one component per dot.
- A mark added while Today is open pops in on the `pop` spring from nothing (or from 0.6 when it joins an existing dot). Only the newest six such marks keep their own animated circle; marks already there when the day was read never re-animate.
- Tab return: the line draws to now, the dot rides along, and every dot pops in again in time order (all within about 750 ms), drawn by one clock on the UI thread.
- Reduce motion: no pops, no replay; marks just appear.

**Accessibility:** the path stays hidden from screen readers; the card's label adds "N activities today, last at 4:12 pm." (`todayCopy.hero.activity`).

**Edge cases covered:** no wake time (the path starts at midnight), before dawn (marks still show, the card label includes them), a sick day and a finished arc (marks show as on any day), 100+ activities (clustered), the dev clock and a time zone change (time of day only), light and dark palettes (roles only), narrow phones (the merge gap is in points, so narrow paths merge sooner).

## 3. Motion: the Apple-like layer

- **Springs, not timings,** for anything the hand moves (`motion.spring` tokens: press, settle, morph, pop). They are interruptible, so tapping fast never queues motion.
- **PressableScale** (`components/PressableScale.tsx`) on every pressable surface: buttons give to 0.96, cards 0.98, rows 0.985, and spring back. Used by Button, the order rows, quick logs, chips, option cards, the tiles and the hero.
- **Numbers roll:** the hero count, the run, the purse and the timer digits slide and fade with a spring when they change.
- **Ticks pop:** the status circle already pops; the glows ease warmer as the day holds or pays.
- **Reduce motion:** every spring falls back to an instant change (the pressed style stays).
- **Surfaces:**
  - Cards get larger continuous corners (`borderCurve: 'continuous'` on iOS) and a hairline border.
  - Shadows stay off on dark palettes and are soft on light ones.
  - No new colours: everything comes from the palette roles.

### Tab motion (built, 31 Oct)

- **Slide:** the tabs navigator's own scene animation (`sceneStyleInterpolator` and `transitionSpec` in the bottom tabs vendored in Expo Router 57). Its progress (-1 left of the active tab, 0 active, 1 right) maps to a full screen width, so the tabs move as one strip of pages on the `morph` spring. Reduce motion: the navigator's cross-fade. `components/navigation/tabTransition.ts`.
- **Swipe:** `TabSwipe` wraps each tab through the navigator's `screenLayout`: a gesture-handler pan that starts past 24 sideways and fails past 14 vertical, so lists scroll. A native horizontal list cancels it once it scrolls; sheets and menus are Modals and never reach it. A clear drag (22% of the width) or a flick (600/s) moves one tab, with the tab whoosh; the content leans with the finger and springs back. Rules in `lib/tabSwipe.ts` (tested).
- **Return motion:** `useTabReturn` counts focus returns (not the first open). Veni: the day path draws to now, the dot rides along and the activity marks pop in time order. Vidi: stat numbers roll in, week bars rise. Vici: the rank bar fills. All under about 700 ms; none with reduce motion.

## 4. Focus (Acies, "the battle line")

Built in wave 5 (step E, 31 Oct); spec in [TASKS-2026-10-31-wave5.md](TASKS-2026-10-31-wave5.md) sections 5 to 7. Route `/focus` (`src/app/focus.tsx`), a stack screen that rises in (`fade_from_bottom`, then each stage springs in on `settle`). Components in `components/focus/`, rules in `features/focus/`, records in `db/focus.ts`.

**Setup** (`FocusSetup`), top to bottom:

Since 1 Nov the setup says less: no tone subtitle, no "Time" label, one rule line per guard, no pay-rate line, no Comites caption. One short line per element; accessibility labels stay full.

1. **Time** (`DurationPicker`, `DurationRuler`, `CustomDurationSheet`): a big `h:mm` readout; presets 25m, 45m, 1h, 1h 30m and Custom in one row of equal chips (they shrink to fit a 320 pt phone and wrap only with very large text); Custom (hours and minutes typed in, any whole minute from 5 to 180); the ruler, 5 to 180 in 5-minute steps. The ruler reads its value from the scroll offset (`minutesAtOffset`) on every scroll event while the finger or its fling moves it, and again on drag end and momentum end, so the readout is always the tick under the needle. A value set from outside glides the ruler and is never overwritten on the way.
2. **Guard** (`GuardPicker`): three cards in a row with drawn emblems (`avatars/GuardAvatar`, SVG from palette roles: Custos an open helmet with an eye, Imperium a crested helmet, Silentium a closed helm), level pips (the level is spoken, not printed), the plain label and the Latin name; the chosen card glows and its one-line rule shows below. The pay is in the footer's reward line.
3. **Permission notice** (`GuardPermissionNotice`): with the Vinco build and the guard service off, the prominent disclosure Google Play requires (what is seen, what it does, nothing leaves the phone) and "Turn on the guard" (the accessibility settings). Custos without the overlay asks for "Display over other apps". The "blocking is off" and shortcut-bubble lines are on the permissions screen only. In Expo Go: "Blocking needs the Vinco build. The timer still runs." A focus runs either way (timer and reward), blocking off.
4. **Comites** (`ComitesRow`, `ComitesPicker`): the Phone app (always allowed), then three slots; the picker lists `guardBridge.listLaunchableApps()` with icons and a search. Saved in the guard store (`comites`, version 2, sanitized on restore, at most 3). In Expo Go the picker says the apps arrive with the Vinco build.
5. **Focus log** (`FocusLog`): minutes held today, this week (Monday to Sunday) and all time, then the **last three** finished sessions (day, time, guard, length, Held or Retreated).
   - **See all** opens `/focus-log` (1 Nov): Week, Month or Year (`SegmentedControl`), a navigator (arrows either side of "26 Oct to 1 Nov", "October 2026", "2026"; forward stops at the current period, back at the day of the first finished focus), then a bar per day (a month per bar in Year): minutes held in gold with the minutes a retreated focus lasted stacked above, muted, and a legend. Tap a bar for its value. Below: minutes held, focuses held, retreats, best day, most days in a row, a three-part bar by guard (Watch `info`, Block `accent`, Silence `seal`, each named), then the period's sessions (a virtualised `FlatList`). A period with no focus gets the tone's empty line.
   - **Rules** (`features/focus/history.ts`, tested): a focus counts on the day it began (also past midnight); a running one is left out until it settles; retreated minutes are start to end, kept within the planned length (a clock moved back reads 0). Buckets come from `features/periods` (shared with Gloria, see REWARDS.md section 5).
6. **Pinned footer:** one reward line ("+8 denarii · +25 glory points"; under 10 minutes "+4 glory points · denarii from 10 min"; after three paid "+25 glory points · 3 paid today"; Gloria is 1 a minute held) and **Slide to begin** (`SlideToConfirm`: a gesture-handler knob, snaps back unless let go past 85%; screen readers get an "activate" action). With no Truce held, the Truce sheet first (`TruceSheet`, mode `begin`): "Without one, this focus can't end early.", "Buy for 50" (buys the Shop's Truce, then the focus begins) and "Begin anyway". When one can't be bought, one line says why ("Need 30 more denarii for a Truce.", "One Truce a day, and today's is bought.").

**Running** (`FocusActive`), one composed screen (1 Nov), top to bottom:

1. **Header:** the minimise chevron, or under Silentium a lock (its label says the screen stays). No eyebrow.
2. **Hero** (`FocusHero`): a ring that drains as the time runs out (`ProgressRing`, accent; "N% of the focus done" for screen readers), the time left inside it (`FocusClock`: large `h:mm`, seconds beside) and one small line: "Ends 7:40 pm · Limit". The ring takes the smaller side of its space; the digits are 27% of its diameter and ignore the phone's font size (sized from the ring), so nothing clips at 320 pt or with large text. Before the first layout it uses a window-based estimate, so the time shows from the first frame.
3. **Tiles**, one row: **Truces** (`TruceTile`, a third) and **Rain** (`RainTile`, two thirds).
4. **The dock** (`FocusDock`), a full-width tile: the Phone app and the Comites, opened through `guardBridge.launchApp` (the Phone app falls back to `tel:`). With no Comites, a "+" explains they are chosen before a focus begins.
5. **Slide to retreat** (`RetreatControl`). The cost is in its screen reader hint, not printed.

- **Space:** the free height is shared four to one between the hero and the controls; the controls never shrink below their content, so on a small phone the ring gives way, and on a tall one the rain tile grows (up to `tileHeight + huge`). No fixed heights for the large parts.
- **Truce tile:** the count. With none held it carries a "+" badge and is a button that opens the Truce sheet (`TruceSheet`, mode `retreat`): "Ending early spends a Truce.", "Buy for 50", "Back to the focus"; when one can't be bought, one line: the reason and "The focus runs to its end." A refused retreat (the knob snaps back, `denied` cue, a screen reader announcement) shakes the tile (short swings with `withSequence` and `withRepeat` on the UI thread, no callbacks) and pulses it to the danger colours; with reduce motion only the pulse. The sheet hides itself if a Truce arrives from elsewhere (the Shop).
- **Rain tile:** falling pixels (`RainField`, UI thread; paused when hidden, asleep, backgrounded or with reduce motion). A tap drops a ripple where the finger lands (two rings; three slots reused in turn; a gesture-handler tap that only writes a shared value; none with reduce motion). A speaker switch in the corner (52 pt) turns the rain sound on and off, saved in `useFocusUiStore.isRainSoundOn` (persisted as `vinco.focus`, off by default).
- **Rain sound** (`useRainSound`): `assets/sounds/ambient/rain.wav`, a seamless 24 s mono loop at 22.05 kHz (about 1 MB; no ogg or m4a encoder in the toolchain), made by `scripts/generate-rain.mjs` (`npm run sounds:rain`: filtered pink and brown noise, band-passed droplets with a few soft plips, the last 2 s crossfaded into the first). `useAudioPlayer` with `loop`; fades in and out over 400 ms; stops at once when the app leaves the foreground, and with the screen (the focus ending, minimise, Back). The user's own toggle, so it ignores the app's Sounds setting; the app's audio mode is untouched (`playsInSilentMode: false`), so the phone's silent mode still mutes it.
- **Guard events** (`useFocusNotice`): a nudge, an app blocked or an app closed shows a short notice.
- **Back:** under Silentium the screen can't be left (`useFocusLock`: Back swallowed, `beforeRemove` prevented, swipe-back off) and there is no minimise; otherwise Back and the chevron minimise to Today, where the tile shows the time left.
- **Screensaver** (`useScreensaver`, `DriftingClock`): kept awake (`expo-keep-awake`). After 10 s without a touch the controls fade, the clock drifts slowly around the screen (always fully on screen) and the app window dims (`expo-brightness`, the window only, no permission). Any touch wakes it at normal brightness; leaving the screen, the app going to the background and unmounting always restore. Reduce motion: no drift, still dims. A development build made before `expo-brightness` was added simply doesn't dim (`lib/screenBrightness.ts` loads it guarded).

**Complete** (`FocusComplete`): held, the laurel pops in with the minutes, then **Claim** reveals the pay (denarii, already in the ledger since completion, and glory points) with the `coin` cue. The HUD counters fade in at the top of the result, and `onClaim(origin, rewards)` launches the reward flight from the button to them (`isAlreadyCounted`, see [REWARDS.md](REWARDS.md) section 2). Retreated: a neutral "Retreated" and "A Truce spent. It pays nothing.", then Done. The "+8 denarii" and the minutes line shrink to fit rather than clip.

**Opening by itself** (`FocusTile`): once per app start, a focus still running opens `/focus` (the app was killed mid-focus); a focus that finished (here or while the app was closed) opens its result once. Seen results are remembered for the session (`useFocusUiStore`).

**Sounds:** `focusStart` (slide to begin), `focusHeld` (the result), `retreat`, `denied` (a refused retreat), `chime` (a Truce bought), `toggle` (the rain switch) and `coin` (the claim; for step D's coin flight too), all through `useFeedback`. The rain loop is the one ambient sound (`useRainSound`, above). The `standDown` cue is no longer played.

**The rules** (`src/features/focus/`, pure and tested):

- **Length:** 5 to 180 minutes; the ruler in steps of 5 (`snapRulerMinutes`), a custom length in whole minutes (`clampFocusMinutes`, `parseCustomMinutes`).
- **Reward:** minutes times the guard's rate, rounded: Custos 0.2, Imperium 0.3, Silentium 0.4 denarii a minute; 10 minutes or more; at most 120 counted; at most 3 rewarded a day (ledger reasons `focus_1` to `focus_3`). Examples: 25 min Imperium = 8; 60 min Silentium = 24. Gloria: 1 a minute held (`focusGloria` in `features/gloria`, the one place the rate lives, from `heldMinutes` in `features/focus`).
- **Retreat** (`canRetreat`, changed 1 Nov): ending early spends one Truce, nothing else. With no Truce held the focus can't be ended: `retreatFocus` returns `noTruce` and changes nothing; the user can buy a Truce (the Shop's item and rules: at most 3 held, one bought a day, the shortfall named) and slide again, or the focus runs to its end. The 50-denarii purchase and the 30-second stand-down are gone. Spent in one transaction with fresh values, keyed by the session (`focus_retreat_<id>` in `truces`), so several retreats a day never collide and one session is never charged twice. Ledger rows `focus_retreat_<id>` from before 1 Nov (the old denarii path) stay in the treasury history. The native guard hears `endFocus()` only once the Truce is spent.
- **Completion:** due when the phone's clock reaches the end; a clock set back before the start never completes; while Vinco stays open a clock set forward can't finish early (`getTrustedNow`). Across a restart the wall clock decides; the native guard keeps its own hard stop.
- **One at a time:** a second focus can't begin while one runs.
- **The guard:** `guardBridge.startFocus({ guard, startedAt, endsAt, allowedPackages, copy, theme })` with the Comites and the dialer, the overlay words and the active palette; `endFocus()` on completion, retreat and "Reset the journey". Native detail in [GUARDIANS.md](GUARDIANS.md).

**Data:** `focus_sessions` (migration `0011`: id, day, guard, minutes, started_at, ends_at, ended_at, status `running|completed|abandoned`, reward). Pay is ledger rows `focus_1` to `focus_3`; a retreat is a `truces` row `focus_retreat_<id>` (amount -1); a Truce bought from the focus screens is an ordinary Shop purchase. No migration. A "Focus held" local notification fires at the end.
