# The day, start to finish

How a day feels in Vinco, screen by screen. The rules for orders and tasks are in [ORDERS-AND-TASKS.md](ORDERS-AND-TASKS.md). Code follows this file; change it first if the flow changes.

## 1. Dawn: "I'm up" (Today, before wake-up)

Until wake-up is logged, the **dawn card** takes the hero's place on Today (1 Nov: same size as the Dies card, which replaces it once wake-up is logged).

- A pill with the planned wake time, the greeting, and one big button **"I'm up"**.
- Below it, the orders wait, dimmed and not tappable, so the day has one clear first step.
- **"I'm up" opens the wake sheet:**
  - **Woke up at:** now, prefilled. Tap to change it (native time picker).
  - **Went to sleep at:** prefilled with the phone's own estimate when there is one (the screen going dark last night, see below), else the last bedtime logged, else 11:00 pm. Tap to change it. When the estimate is used, a small muted line says so ("Bedtime from when your screen went dark") until the time is changed.
  - A live line: "7 h 20 m of sleep".
  - **"Start the day"** saves both. Wake-up is held, sleep is logged, and the orders open (the rise sound plays).
- **Rules:**
  - Sleep is wake time minus bedtime. A bedtime later than the wake time means the night before.
  - Anything under 1 hour or over 16 hours is refused with "Check the times".
  - A wake time in the future is refused.
- **Bedtime from the phone** (2 Nov): with the guard service on, the Vigil keeps last night's screen-dark stretch (`VigilNight.kt`, see GUARDIANS.md "Night rest"). `useBedtimeDefault` / `useLatestBedtime` read it through `guardBridge.getNightRest()` (on mount and each return to the front) and use it only when `getUsableBedtime` (`src/features/sleep/nightRest.ts`) accepts it: it began before the wake-up and gives 1 to 16 hours of sleep, and only on the real today (not a dev clock). **The alarm** (Aurora's mission) logs wake-up with that bedtime too, or none when there is no usable estimate (as before). Without the guard service, in Expo Go, or with no estimate, nothing changes.
- **Feeling sick today** (a quiet button on the dawn card) opens a sheet: a sick-day Truce for today, and exactly what it costs (one from the reserve, or denarii, or not affordable). Calling it shows the Dies card in its "Sick day" state, with "I'm feeling better" at its top right. The orders stay open: log anything you manage. Hold every order and the Truce comes back at midnight. "I'm feeling better" takes it back the same day (the Truce, and any denarii paid, return). Neutral in every tone.
- **After waking:** the wake-up row shows "Up at 6:34 · 7 h 20 m sleep". Tapping it reopens the sheet to correct the times; a long press undoes wake-up (back to the dawn card).

## 2. The orders (Today)

Today, top to bottom (1 Nov, night; full layout in [TODAY-AND-FOCUS.md](TODAY-AND-FOCUS.md) section 2): the shared header with the **user button** (opens the menu: Settings, Orders and to-dos, Permissions, Guard, Aurora, the Shop, the oath), the hero, the Reels and Focus tiles, then one **Orders | Tasks** switch. The orders are the Orders side.

- No heading or hint lines: the rows speak for themselves (tap to log, press and hold to take one back).
- **Done orders sink.** An order at its full goal slides to the bottom of the list with its mark; taking it back brings it up again.
- **The VINCO stamp lands only when the day is conquered** (every order at its full goal). A day held at the minimum gets the "Line held" seal card instead, matching how the calendar records it. A day with no orders is never held.
- **Extra amounts count.** Hitting the full goal is not a ceiling. Water, meals and workout can go past it (5 L on a 4 L goal), up to a sane cap (water 10 L, meals 8, workout 300 min). Over the goal reads "5 L · conquered, 1 over".
- **Water and meals:** one tap adds one step, past the goal too. Long press removes one.
- **Workout:** the sheet offers Hold the line, Conquer, or **an exact time** (a stepper in 5-minute steps), so a 90-minute session logs as 90.
- **Own orders** count up: a tap adds one unit ("3 of 12 glass"), up to 20 a day. Bigger goals (10000 steps) open a small sheet to type the amount. Long press takes one back.
- **No orders yet** (free training started with none): the dawn card, then a "No orders yet" card suggesting water (one tap adds it).
- **Free training:** the run is in the Today summary sheet (tap the hero). No Truce banner, no loss screen.

## 3. Daily logs: selfie, weight, calories (Today)

Three rows on the Tasks side of Today's switch (1 Nov, night; before, a floating log button). Each shows its value once done today.

| Log          | Opens                                                         |
| ------------ | ------------------------------------------------------------- |
| **Selfie**   | The selfie screen                                             |
| **Weight**   | The weight sheet (kg)                                         |
| **Calories** | The calories sheet: whole kcal for the day, optional, neutral |

### The selfie screen

1. **Camera** with yesterday's selfie over it as a ghost. A slider under the frame, "Yesterday's outline", sets its opacity from 0 to 60% (remembered between days; 30% by default). With no earlier selfie, the dashed face outline shows instead.
2. **Shutter.** The new photo shows at once (each capture is a new file, so a retake never shows the old one).
3. **Check:** the photo is shown with the face outline (and the ghost, if any) over it, and a question: "Face inside the outline, like yesterday?" **"Looks right"** saves it; **"Retake"** goes back to the camera. True face detection needs a custom build (planned with the Vigil); until then the user confirms by eye.
4. **Saved:** "Day XII saved. 12 of 60 frames", the strip of recent days, then the weight field and "Done".

### Body weight

- The Weight quick log opens a small sheet: one number field (kg, 30 to 250, comma or dot), prefilled with today's value if logged, "Save" and "Not now".
- The selfie flow still offers the same field after the photo; both write the same day's weight.
- Weight stays neutral in every tone: no jokes, no judgement, trends over weeks.

## 3b. The timelapse

- A full-screen player shows the selfies one after another, oldest first, about a third of a second each. It plays on open and stops on the last frame ("Play again"). Arrows step frame by frame (pausing). A label shows the day ("Day XII · 14 October") and a progress bar with "12 / 48".
- **This campaign** (`/timelapse?scope=arc`): from Vidi's timelapse card (Today no longer has a Proof section).
- **Every selfie ever** (`/timelapse?scope=all`): from Vici ("All your proof"), across every arc, from the first selfie to the latest. Vici is the place for the whole journey; Today and Vidi stay on the current campaign.

## 4. Vidi: the Commentarii (logs)

Caesar kept _Commentarii_, his campaign notes. Vidi gets a segmented control, **Calendar | Commentarii**, matching the prototype's segment style (and its tick sound).

**Calendar:** tap any day for a summary sheet: each order against its goal, sleep, weight, calories, the selfie and to-dos ticked. In free training a missed day shows as a day off. (Past days are judged against the arc's current goals; see "Next" in TASKS-2026-10-13.md.)

**Commentarii** shows one log at a time, picked with chips: **Sleep · Water · Workout · Body**.

- **Sleep, Water, Workout:** a weekly bar chart, Monday to Sunday, like the prototype:
  - Values above the bars, a dashed target line and the target in the corner.
  - Arrows move week by week through the arc.
  - **Sleep:** bars in the sleep colour, porphyry under 6 h. Target 7 h 30 m.
  - **Water and workout:** gold at the full goal, outlined gold at the minimum, porphyry under the minimum. Target is the full goal.
  - An insight card under the chart: the week's average and best day ("Average 7 h 05 m. Best: Friday, 8 h 10 m.").
- **Body:** weight as a line across the arc and calories as a dashed line on the same dates, each on its own scale. Chips hide either line (remembered in preferences). The weekly weight average is the headline ("72.4 kg this week, down 0.6 kg"), with a "Log today's weight" button. Neutral copy only.
- **Empty states:** each log explains how it fills ("Log your sleep with "I'm up" each morning").

## 5. Sounds

- Every UI sound matches the prototype's recipe exactly, at an even, clean level (no clipping, nothing too quiet).
- **Switching tabs** plays a whisper-quiet whoosh (-17 dBFS, 0.14 s).
- **Sounds are off by default** (13 Oct). **Always on:** the DAY I seal, the oath locking in and the VINCO stamp play even with Sounds off (the phone's silent mode still mutes them).
- **The Vidi segments** play the prototype's tick.

## Data

| Change                                                                            | Where                 |
| --------------------------------------------------------------------------------- | --------------------- |
| Bedtime per day (`slept_at`, ISO time, the night before)                          | `day_logs`            |
| Selfie files named per capture (`YYYY-MM-DD-<time>.jpg`); the old file is deleted | `src/media`           |
| Ghost opacity preference (0 to 0.6)                                               | preferences store     |
| Calories per day (whole kcal, migration 0009)                                     | `day_logs.calories`   |
| Hidden body chart lines                                                           | preferences store     |
| Order amounts may exceed the full goal, up to a cap per order                     | `src/features/orders` |
