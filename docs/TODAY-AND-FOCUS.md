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
3. **Two tiles** (new, side by side; stacked on phones narrower than 340 pt):
   - **Run (Stipendium):** the run as a big number, "days in a row", and a 7-pip track for this week with coin marks on 3, 5 and 7. A cool glow (the `info` role). Tap: the run pay sheet (what each step pays, the next reward). It replaces the StreakCard and the campaign chip.
   - **Purse:** denarii as a big number, "+15 today" in silver, with a warm glow (the `currency` role). Tap: the Forum. It replaces the denarii chip.
4. **Focus CTA** (new): one row. A round button in the accent with a play mark, then "Focus" and "Acies · guard your time". On the right, a status dot: green "Ready", or the time left when a focus is running ("18:42 left", pulsing). Tap: springs open into the focus view (section 4).
5. **Quick logs, then the orders, the seal card and the to-dos**, as now.

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

## 4. Focus (Acies, "the battle line")

**The flow:**

1. **Open.** Tapping the CTA measures it and springs a surface from the CTA's exact frame to full screen (left, top, width, height and corner radius, all on the `morph` spring). The setup content fades and rises in after the surface is mostly open. Closing reverses it back into the CTA. The system back gesture closes setup and minimises a running focus.
2. **Setup:**
   - **Time:** a big number (minutes) over a horizontal ruler from 5 to 180 minutes in 5-minute steps. Ticks snap with a selection haptic and labels sit every 15. Presets above it: 15, 25, 45, 60, 90.
   - **Guard:** three cards, each with what it does and its reward rate:
     - **Custos** ("Limit apps"): marked apps allowed for 5 minutes in total.
     - **Imperium** ("Block apps"): marked apps blocked.
     - **Silentium** ("Block everything"): everything but calls, messages and Vinco.
   - **Reward line:** "Hold the line to the end: +12 denarii".
   - **Start:** a primary button, "Begin".
3. **Running:**
   - A large ring counts down, with mm:ss in the display face, the guard's name, and "Ends at 2:30 pm".
   - The ring and digits move on the second, smoothly.
   - "Retreat" (give up) needs a 1.5-second hold, with the ring filling under the finger. Giving up pays nothing and says so plainly, neutral in every tone.
   - The session is saved, so leaving the app, locking the phone or killing the app never loses it. A local notification fires at the end ("Focus held. +12 denarii waiting.").
4. **Complete:** the laurel pops in on the `pop` spring with "+12 denarii", and the minutes go into the run tile's footnote for today. "Done" springs the view back into the CTA. If the app was closed at the end, the completion shows the next time Today opens.

**The rules** (`src/features/focus/`, pure and tested):

- **Duration:** 5 to 180 minutes, in steps of 5.
- **Reward:** minutes times the guard's rate, rounded: Custos 0.2, Imperium 0.3, Silentium 0.4 denarii a minute.
  - Only 10 minutes or more earn.
  - At most 120 minutes count per session.
  - At most 3 rewarded sessions a day. They are ledger reasons `focus_1` to `focus_3`, so (day, reason) stays unique.
  - Examples: 25 min Imperium = 8; 60 min Silentium = 24; 120 min Silentium = 48.
- **Completion:** a session is complete when now reaches its end on the phone's clock. It is judged on next open if the app was closed. A clock set forward can't complete a session early, because the end is checked against both wall time and elapsed time.
- **One at a time:** starting a new focus while one runs is impossible; the CTA shows the running one.

**Blocking** needs the native Vigil module (an AccessibilityService, [GUARDIANS.md](GUARDIANS.md)):

- The focus calls `guardBridge.startFocus({ mode, endsAt, allowanceMinutes })` and `endFocus()`.
- Until the module ships, the setup screen says plainly: "Blocking arrives with the Vigil. The timer and the reward work now."
- The reward is earned on the timer alone until then.

**Data:**

- Migration `0011_focus_sessions`: `focus_sessions` (id, day, guard, minutes, started_at, ends_at, ended_at, status `running|completed|abandoned`, reward).
- Rewards are ledger rows `focus_1` to `focus_3`.

### Focus as built (31 Oct)

Built as specified above, with these differences:

- **Clock set forward:** completion needs the wall clock to reach the end and never counts a clock set back before the start. The elapsed-time check (a monotonic clock read when the focus began) only runs while Vinco stays open in the foreground, because that clock can pause while the phone sleeps and is lost when the app is closed. Across a restart the wall clock decides, until the Vigil module reports the phone's elapsed time (GUARDIANS.md). Why: a stricter check would refuse honest focuses that ran with the phone locked.
- **Run tile footnote:** not wired yet. The minutes are stored per session (`selectFocusOn(day)`, completed rows), ready for the tile.
- **Giving up** shows a short "Retreated" view (it pays nothing) with "Done", so the result is always seen before the view springs back.
- **A focus with no pay** (under 10 minutes, or a fourth that day) still completes and shows the laurel, with the plain reason instead of the denarii.
