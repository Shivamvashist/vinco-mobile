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
   - **The day path:** a dotted arc from the left edge (the planned wake time) to the right (midnight). It is solid up to now, with a glowing dot at now, so time running out is felt, not read. Each order done adds a small notch where it was logged.
   - **The glow:** a radial gradient in the accent rises from the bottom. It is dim while the day is open, warmer once held, and full once conquered. It is a scaled view of an SVG gradient, so it costs no JS frames.
   - **Tap:** opens the day summary for today (the same sheet as Vidi's calendar).
3. **Two tiles** (side by side; stacked on phones narrower than 340 pt):
   - **Run (Stipendium):** the run as a big number, "days in a row", and a 7-pip track for this week with coin marks on 3, 5 and 7. A cool glow (the `info` role). Tap: the run pay sheet (what each step pays, the next reward). It replaces the StreakCard and the campaign chip.
   - **Focus** (wave 5): "Ready", or the time left (`h:mm`, live) while a focus runs, with an accent glow. Tap: the focus screen (section 4). The purse tile it replaced moved to the header counter (wave 5 step D).
4. **Quick logs, then the orders, the seal card and the to-dos**, as now.

Before dawn the hero, the tiles and Focus show, but the orders wait (as now). On a finished arc the hero shows "Arc complete" and the tiles stay.

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
- **Return motion:** `useTabReturn` counts focus returns (not the first open). Veni: the day path draws to now, the dot rides along and the notches pop in time order. Vidi: stat numbers roll in, week bars rise. Vici: the rank bar fills. All under about 700 ms; none with reduce motion.

## 4. Focus (Acies, "the battle line")

Built in wave 5 (step E, 31 Oct); spec in [TASKS-2026-10-31-wave5.md](TASKS-2026-10-31-wave5.md) sections 5 to 7. Route `/focus` (`src/app/focus.tsx`), a stack screen that rises in (`fade_from_bottom`, then each stage springs in on `settle`). Components in `components/focus/`, rules in `features/focus/`, records in `db/focus.ts`.

**Setup** (`FocusSetup`), top to bottom:

1. **Time** (`DurationPicker`, `DurationRuler`, `CustomDurationSheet`): a big `h:mm` readout; presets 15m, 25m, 45m, 1h, 1h 30m, 2h; Custom (hours and minutes typed in, any whole minute from 5 to 180); the ruler, 5 to 180 in 5-minute steps. The ruler reads its value from the scroll offset (`minutesAtOffset`) on every scroll event while the finger or its fling moves it, and again on drag end and momentum end, so the readout is always the tick under the needle. A value set from outside glides the ruler and is never overwritten on the way.
2. **Guard** (`GuardPicker`): three cards in a row with drawn emblems (`avatars/GuardAvatar`, SVG from palette roles: Custos an open helmet with an eye, Imperium a crested helmet, Silentium a closed helm), level pips and "Level I to III"; the chosen card glows and its rules show below with its pay rate.
3. **Permission notice** (`GuardPermissionNotice`): with the Vinco build and the guard service off, a prominent disclosure (what is seen, what it does, nothing leaves the phone) and "Turn on the guard" (the accessibility settings). Custos without the overlay asks for "Display over other apps". In Expo Go: "Blocking arrives with the Vinco build." A focus runs either way (timer and reward), blocking off.
4. **Comites** (`ComitesRow`, `ComitesPicker`): the Phone app (always allowed), then three slots; the picker lists `guardBridge.listLaunchableApps()` with icons and a search. Saved in the guard store (`comites`, version 2, sanitized on restore, at most 3). In Expo Go the picker says the apps arrive with the Vinco build.
5. **Focus log** (`FocusLog`): minutes held today, this week (Monday to Sunday) and all time, then the finished sessions (day, time, guard, length, Held or Retreated).
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
- **The guard:** `guardBridge.startFocus({ guard, startedAt, endsAt, allowedPackages, copy })` with the Comites and the dialer; `endFocus()` on completion, retreat and "Reset the journey". Native detail in [GUARDIANS.md](GUARDIANS.md).

**Data:** `focus_sessions` (migration `0011`: id, day, guard, minutes, started_at, ends_at, ended_at, status `running|completed|abandoned`, reward). Pay is ledger rows `focus_1` to `focus_3`; retreat costs are `focus_retreat_<id>` rows. A "Focus held" local notification fires at the end.
