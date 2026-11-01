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

## 2. Today, top to bottom

1. **Header** (unchanged): "SAT 31 OCT · DAY XII OF LX", the weekday, the user button.
2. **The Dies card** (hero, new). Fills the width, 236 pt tall (scaled to the phone, `layout.heroCardHeight`), corners `radius.xl`.
   - **Top row:** a small mark and the label "Today", with a pill on the right showing the state: "Open", "Held", "Conquered", "Sick day" or "Before dawn".
   - **The number:** orders done today, set big in the display face ("3" and a small "/5"), with a caption ("orders held · +15 denarii"). Before dawn it shows the planned wake time instead. It rolls to the new value with a spring when an order is ticked.
   - **The day path:** a dotted arc from the left edge (the day's start) to the right (midnight). It is solid up to now, with a glowing dot at now, so time running out is felt, not read.
   - **The day's activity on the path** (1 Nov): every thing done today is a small dot at the moment it happened, so the day reads as a timeline. Details below under "Day activity timeline".
   - **The glow:** a radial gradient in the accent rises from the bottom. It is dim while the day is open, warmer once held, and full once conquered. It is a scaled view of an SVG gradient, so it costs no JS frames.
   - **Tap:** opens the day summary for today (the same sheet as Vidi's calendar).
3. **Two tiles** (side by side; stacked on phones narrower than 340 pt):
   - **Run (Stipendium):** the run as a big number, "days in a row", and a 7-pip track for this week with coin marks on 3, 5 and 7. A cool glow (the `info` role). Tap: the run pay sheet (what each step pays, the next reward). It replaces the StreakCard and the campaign chip.
   - **Focus** (wave 5): "Ready", or the time left (`h:mm`, live) while a focus runs, with an accent glow. Tap: the focus screen (section 4). The purse tile it replaced moved to the header counter (wave 5 step D).
4. **Quick logs, then the orders, the seal card and the to-dos**, as now.

Before dawn the hero, the tiles and Focus show, but the orders wait (as now). On a finished arc the hero shows "Arc complete" and the tiles stay.

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

1. **Time** (`DurationPicker`, `DurationRuler`, `CustomDurationSheet`): a big `h:mm` readout; presets 15m, 25m, 45m, 1h, 1h 30m, 2h; Custom (hours and minutes typed in, any whole minute from 5 to 180); the ruler, 5 to 180 in 5-minute steps. The ruler reads its value from the scroll offset (`minutesAtOffset`) on every scroll event while the finger or its fling moves it, and again on drag end and momentum end, so the readout is always the tick under the needle. A value set from outside glides the ruler and is never overwritten on the way.
2. **Guard** (`GuardPicker`): three cards in a row with drawn emblems (`avatars/GuardAvatar`, SVG from palette roles: Custos an open helmet with an eye, Imperium a crested helmet, Silentium a closed helm), level pips and "Level I to III"; the chosen card glows and its rules show below with its pay rate.
3. **Permission notice** (`GuardPermissionNotice`): with the Vinco build and the guard service off, a prominent disclosure (what is seen, what it does, nothing leaves the phone) and "Turn on the guard" (the accessibility settings). Custos without the overlay asks for "Display over other apps". In Expo Go: "Blocking arrives with the Vinco build." A focus runs either way (timer and reward), blocking off.
4. **Comites** (`ComitesRow`, `ComitesPicker`): the Phone app (always allowed), then three slots; the picker lists `guardBridge.listLaunchableApps()` with icons and a search. Saved in the guard store (`comites`, version 2, sanitized on restore, at most 3). In Expo Go the picker says the apps arrive with the Vinco build.
5. **Focus log** (`FocusLog`): minutes held today, this week (Monday to Sunday) and all time, then the **last three** finished sessions (day, time, guard, length, Held or Retreated).
   - **See all** opens `/focus-log` (1 Nov): Week, Month or Year (`SegmentedControl`), a navigator (arrows either side of "26 Oct to 1 Nov", "October 2026", "2026"; forward stops at the current period, back at the day of the first finished focus), then a bar per day (a month per bar in Year): minutes held in gold with the minutes a retreated focus lasted stacked above, muted, and a legend. Tap a bar for its value. Below: minutes held, focuses held, retreats, best day, most days in a row, a three-part bar by guard (Watch `info`, Block `accent`, Silence `seal`, each named), then the period's sessions (a virtualised `FlatList`). A period with no focus gets the tone's empty line.
   - **Rules** (`features/focus/history.ts`, tested): a focus counts on the day it began (also past midnight); a running one is left out until it settles; retreated minutes are start to end, kept within the planned length (a clock moved back reads 0). Buckets come from `features/periods` (shared with Gloria, see REWARDS.md section 5).
6. **Pinned footer:** the reward line ("+8 denarii · +25 glory points"; Gloria is 1 a minute held) and **Slide to begin** (`SlideToConfirm`: a gesture-handler knob, snaps back unless let go past 85%; screen readers get an "activate" action). With no Truce held, a "No Truce" sheet first: retreating early will cost 50 denarii, or a 30-second stand-down; "Get a Truce" (the Forum) or "Begin anyway".

**Running** (`FocusActive`):

- The time left as a large `h:mm` with the seconds beside it, an "Ends" tile, then "Truces held" and a small rain field (`RainField`, falling pixels on the UI thread; paused when hidden, asleep, backgrounded or with reduce motion).
- **Slide to retreat** (`RetreatControl`): spends a Truce; with none, buys one on the spot for 50 denarii; with neither, a 30-second stand-down (a soft tick each second, "Stay in the line" cancels), then retreats. Retreating never pays. Neutral in every tone.
- **The dock** (`FocusDock`): the Phone app and the Comites, opened through `guardBridge.launchApp` (the Phone app falls back to `tel:`). With no Comites, a "+" explains they are chosen before a focus begins.
- **Guard events** (`useFocusNotice`): a nudge, an app blocked or an app closed shows a short notice.
- **Back:** under Silentium the screen can't be left (`useFocusLock`: Back swallowed, `beforeRemove` prevented, swipe-back off) and there is no minimise; otherwise Back and the chevron minimise to Today, where the tile shows the time left.
- **Screensaver** (`useScreensaver`, `DriftingClock`): kept awake (`expo-keep-awake`). After 10 s without a touch the controls fade, the clock drifts slowly around the screen (always fully on screen) and the app window dims (`expo-brightness`, the window only, no permission). Any touch wakes it at normal brightness; leaving the screen, the app going to the background and unmounting always restore. Reduce motion: no drift, still dims. A development build made before `expo-brightness` was added simply doesn't dim (`lib/screenBrightness.ts` loads it guarded).

**Complete** (`FocusComplete`): held, the laurel pops in with the minutes, then **Claim** reveals the pay (denarii, already in the ledger since completion, and glory points) with the `coin` cue. The HUD counters fade in at the top of the result, and `onClaim(origin, rewards)` launches the reward flight from the button to them (`isAlreadyCounted`, see [REWARDS.md](REWARDS.md) section 2). Retreated: a neutral "Retreated. It pays nothing." and Done.

**Opening by itself** (`FocusTile`): once per app start, a focus still running opens `/focus` (the app was killed mid-focus); a focus that finished (here or while the app was closed) opens its result once. Seen results are remembered for the session (`useFocusUiStore`).

**Sounds:** `focusStart` (slide to begin), `focusHeld` (the result), `retreat`, `standDown` (the tick) and `coin` (the claim; for step D's coin flight too), all through `useFeedback`.

**The rules** (`src/features/focus/`, pure and tested):

- **Length:** 5 to 180 minutes; the ruler in steps of 5 (`snapRulerMinutes`), a custom length in whole minutes (`clampFocusMinutes`, `parseCustomMinutes`).
- **Reward:** minutes times the guard's rate, rounded: Custos 0.2, Imperium 0.3, Silentium 0.4 denarii a minute; 10 minutes or more; at most 120 counted; at most 3 rewarded a day (ledger reasons `focus_1` to `focus_3`). Examples: 25 min Imperium = 8; 60 min Silentium = 24. Gloria: 1 a minute held (`focusGloria` in `features/gloria`, the one place the rate lives, from `heldMinutes` in `features/focus`).
- **Retreat** (`planRetreatPayment`): a Truce, else 50 denarii (`TRUCES.priceDenarii`), else the stand-down (`FOCUS_RULES.standDownSeconds`). Paid in one transaction with fresh values (`retreatFocus`), keyed by the session (`focus_retreat_<id>` in `truces` or `ledger`), so several retreats a day never collide and one session is never charged twice. No migration: the reason column carries the key.
- **Completion:** due when the phone's clock reaches the end; a clock set back before the start never completes; while Vinco stays open a clock set forward can't finish early (`getTrustedNow`). Across a restart the wall clock decides; the native guard keeps its own hard stop.
- **One at a time:** a second focus can't begin while one runs.
- **The guard:** `guardBridge.startFocus({ guard, startedAt, endsAt, allowedPackages, copy, theme })` with the Comites and the dialer, the overlay words and the active palette; `endFocus()` on completion, retreat and "Reset the journey". Native detail in [GUARDIANS.md](GUARDIANS.md).

**Data:** `focus_sessions` (migration `0011`: id, day, guard, minutes, started_at, ends_at, ended_at, status `running|completed|abandoned`, reward). Pay is ledger rows `focus_1` to `focus_3`; retreat costs are `focus_retreat_<id>` rows. A "Focus held" local notification fires at the end.
