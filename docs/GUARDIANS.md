# Guard levels and Aurora

How Vinco watches the phone (the four levels) and wakes the user (Aurora): what's built now, what needs native code, and the order to build it. Product detail is in [v1-docs/PLAN.md](v1-docs/PLAN.md) sections 6 to 9.

## The four levels

The user picks one level. Each includes everything above it in the table.

| Level        | Latin (plain)        | What it does                                                                          | Needs (Android)                                    | Ships |
| ------------ | -------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- | ----- |
| **Pax**      | "Pax" (peace)        | Counts only. Nothing interrupts you. The count shows in Vinco                         | Accessibility service                              | 1.0   |
| **Vigil**    | "Vigil" (the watch)  | Counts reels and shows the floating badge and milestone cards (every 25 by default)   | + Display over other apps                          | 1.0   |
| **Guard**    | "Custos" (the guard) | A quick "why are you opening this?" check before a marked app                         | + the same service, watching app launches          | 1.1   |
| **Imperium** | "Imperium" (command) | Blocks marked apps after your limit. Finish your must-dos for a 10-minute "Clementia" | + a blocking overlay, 24-hour cool-off to turn off | 1.2   |

Rules (all levels):

- **Privacy promise:** reads only whether a reels screen is open and when a new video starts. Never messages, captions, usernames, passwords or video content. Nothing on screen is saved or sent.
- **Never blocked:** calls, contacts, payments, maps (Imperium).
- **Tributum:** past the budget, 10 more reels cost 15 denarii, doubling each time that day (15, 30, 60), at most three times. No debt.
- **Turning Imperium off** takes 24 hours, so it can't be undone in a weak moment.

## Aurora (the alarm)

- An alarm at the planned wake-up time on chosen days. It stops only after a **mission**: **march** (30 steps), **"Gladius"** (the sword: swing the phone 30 times), **see the sky** (a photo of daylight, checked on the phone) or **reach the post** (scan a QR code stuck in the bathroom).
- **"I'm sick"** stops it and calls the sick-day Truce (the same rules as the dawn card).
- **Alarm pass** ("Venia", bought in the Forum): stops it once without the mission.
- Beating it on the first try pays 2 denarii and logs wake-up automatically ("I'm up" is then already done).

## What's built now (10 Oct 2026, menu since 13 Oct)

Everything that doesn't need native code, so the native parts only have to plug in:

| Piece                                  | Where                                                      |
| -------------------------------------- | ---------------------------------------------------------- |
| Levels, their rules, budgets, Tributum | `src/features/guard/` (pure, tested)                       |
| Aurora settings, next ring, missions   | `src/features/aurora/` (pure, tested)                      |
| Saved choices (level, budget, alarm)   | `useGuardStore` (`src/stores/guardStore.ts`), persisted    |
| The bridges native code will implement | `GuardBridge`, `AuroraBridge` (and `unsupported...` stubs) |
| Settings screens (preview state)       | `/guard` and `/aurora`, from the user menu on Today        |

The screens let the user choose now and say plainly "Arrives with the Vinco build": the choice is kept and switches on when the native part ships. Pax is the default.

## How to build the native parts

All three need a **development build** (they can't run in Expo Go). Set up once:

1. `npx expo install expo-dev-client`, then `eas build -p android --profile development`. Install it on the phone; `npx expo start` then serves JavaScript to it like Expo Go.
2. Native code lives in **local Expo modules** (`npx create-expo-module@latest --local`), written in Kotlin, in `modules/`.

### The Vigil module (`modules/vigil`)

- An Android **AccessibilityService** that listens for window changes in a list of packages (Instagram, YouTube, Facebook...). Rules for "a reels screen is open" and "a new video started" come from remote config (later from the API), so a layout change in another app is fixed without an app release.
- Counts are written to the module's own small store and read by JS through `GuardBridge.getTodayCount()`; a JS event (`onReel`) fires live.
- **Badge:** a `WindowManager` overlay (`TYPE_APPLICATION_OVERLAY`) needs "Display over other apps".
- **Guard and Imperium:** the same service sees app launches; it opens a Vinco activity on top (the guard dialogue or the block screen).
- **Play policy:** using Accessibility for this needs a declaration in Play Console and a short video showing the permission and its use. Plan a week for review.
- `GuardBridge` (`src/features/guard/bridge.ts`) is the contract. Replace `unsupportedGuardBridge` with the module's implementation in one place.

### The Aurora module (`modules/aurora`)

- **Exact alarms:** `AlarmManager.setAlarmClock` (shows in the status bar, survives Doze). Needs `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` (an alarm app may declare `USE_EXACT_ALARM`).
- **Full-screen alarm:** a notification with a full-screen intent (`USE_FULL_SCREEN_INTENT`) opening Vinco's alarm screen over the lock screen; looping sound on the alarm audio stream.
- **Reboots:** re-schedule on `BOOT_COMPLETED`.
- **Missions:** sky (camera plus a brightness and colour check on the phone), post (barcode scanning with `expo-camera`), march (step counter via `expo-sensors` Pedometer), Gladius (accelerometer via `expo-sensors`).
- `AuroraBridge` (`src/features/aurora/bridge.ts`) is the contract: `schedule`, `cancel`, `canScheduleExact`, `openExactAlarmSettings`.

### Aurora as built (31 Oct)

- **Native module:** `modules/aurora` (Kotlin), behind `auroraBridge` (the stub stays for Expo Go and Jest).
- **Permission:** `SCHEDULE_EXACT_ALARM`, with an inexact fallback if refused.
- **The ring:** a foreground service loops the alarm sound on the alarm stream (`USAGE_ALARM`), and a full-screen notification on the `aurora` channel opens `vinco://alarm`. There is no snooze. It stops itself after 10 minutes.
- **Full volume (2 Nov):** when it starts ringing, `AuroraVolume.raise` saves the alarm stream's level (in `AuroraStore.savedAlarmVolume`, so a ring cut short by Android is still put right) and sets the stream to its maximum; every way it stops (mission, sick day, pass, the 10-minute stop, the service dying) restores the saved level. The alarm stream needs no permission; a phone that refuses (a Do Not Disturb policy, a work profile, a maker's rule) is caught and logged, and Aurora rings at the user's level.
- **The buzz:** the vibration is marked as an alarm (`VibrationAttributes.USAGE_ALARM` on Android 13+, `AudioAttributes` before), so Do Not Disturb's alarm rule lets it through. At the mission's first step, swing or tap the ring screen calls `stopVibrating()`: the phone is in hand, the sound keeps ringing, and the mission's own haptics can be felt (Android ignores short haptics while a repeating alarm buzz runs).
- **The phone keeps the rule:** the repeat rule lives on the phone (SharedPreferences), so the next ring is set after a ring, a reboot, an update or a clock change, without opening the app.
- **Ring screen `/alarm`:**
  - **One dial for every mission** (`MissionDial`): a big count inside a ring (gold for the march, steel for the sword), one line of instruction, a cue and a small pulse per step or swing, the mission's final cue, and the tap button when the sensor can't count. The hooks (`useMarch`, `useGladius`) return the same `MissionRun` shape (`src/features/aurora/missionRun.ts`).
  - **March:** 30 steps from the step counter. The "Physical activity" permission is asked **ahead** (turning Aurora on with the march, picking the march, the "Step counter" row in "On this phone", or the note under the missions), never at ring time: over the lock screen Android's dialog opens behind the lock and the march used to wait forever on it. At ring time the permission is only read. Taps take over with no step counter, no permission, no answer within 4 s, or no step for 20 s (steps still add); after a minute "Can't walk right now? Tap instead" is offered. The step tally (`tallySteps`) drops the counter's start-up reading (it used to count 1 step with nobody moving) and only moves up (batched steps, the repeat after a return from the background).
  - **"Gladius" (2 Nov):** 30 swings, read from the accelerometer at 50 readings a second, no permission. A swing counts when the reading's size passes 1.6 g over gravity (about 2.6 g in all), then the reading must settle under 0.6 g over gravity and 280 ms must pass before the next (a swing's throw and stop are two peaks 100 to 200 ms apart). Constants in `GLADIUS_RULES`, the detector `readSwing` (`src/features/aurora/gladius.ts`, tested). Each swing plays `shing` (a metal ring, medium haptic); the last plays `sheathe` (heavy haptic). No accelerometer: taps at once. After a minute: "Can't swing? Tap instead".
  - **"I'm sick":** the sick-day Truce; if it can't be paid, the alarm keeps ringing.
  - **"Use an alarm pass".**
  - **First try:** logs wake-up and pays 2 denarii.
- **Not built yet:** "See the sky" and "Reach the post" are marked as coming; they ring with the march until built.
- **UI sounds and the ring:** `shing` and `sheathe` are ordinary cues, so with Sounds off (the default) only their haptics play; the alarm's own sound is loud anyway.

## Focus ("Acies") and the guard (31 Oct)

A focus is a timed stretch with a guard on the phone (spec: [TODAY-AND-FOCUS.md](TODAY-AND-FOCUS.md) section 4, and wave 5 in [TASKS-2026-10-31-wave5.md](TASKS-2026-10-31-wave5.md) sections 5 and 7). The timer, the session record and the reward work in every build; the guards need the development build (see "Focus guards (built)" below).

| Guard                             | What the phone does during the focus                                        | Rate (denarii a minute) |
| --------------------------------- | --------------------------------------------------------------------------- | ----------------------- |
| "Custos" (Watch, Level I)         | An alert, a floating timer, a "back to the line" popup every 3 minutes      | 0.2                     |
| "Imperium" (Limit, Level II)      | 3 minutes in an app outside the focus, then back to Vinco and 3 minutes off | 0.3                     |
| "Silentium" (Lockdown, Level III) | Only Vinco, the Comites and the Phone app                                   | 0.4                     |

- **Bridge calls** (`GuardBridge`, `src/features/guard/bridge.ts`):
  - `startFocus({ guard, startedAt, endsAt, allowedPackages, copy?, theme? })`: called when a focus begins (`theme` is the active palette for the overlays). The module guards until `endsAt` on its own, even if Vinco is killed.
  - `endFocus()`: called when the focus completes or is given up. Safe to call when no focus is on.
  - `onFocusEvent(listener)`: `nudge`, `appBlocked`, `appClosed`, each with the package (or null).
  - The stub does nothing; errors from the module are logged in dev and never stop the timer or the reward.
- **Without the module** (`guardBridge.isSupported` false, Expo Go or an older build), the focus runs with the timer and the reward, and the setup screen says blocking is off.
- **Measured time:** the module keeps its own hard stop on `SystemClock.elapsedRealtime()` within one boot, so moving the clock back can't stretch the guard. The JS side's own check still only runs while Vinco stays open (TODAY-AND-FOCUS.md "Focus as built").

### Focus guards (built, 31 Oct)

The local module `modules/vigil` (Kotlin, module name `VincoVigil`) sits behind `guardBridge`. Expo Go, iOS and Jest get `unsupportedGuardBridge` (nothing throws, nothing is granted); `selectGuardBridge` picks the module when it is built in. Reel counting is native too since 1 Nov: see "The reel counter (built, 1 Nov)" below.

**Pieces (`modules/vigil/android/src/main/java/expo/modules/vigil/`):**

| File                               | Job                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `VigilModule.kt`                   | The JS functions: permissions, settings pages, launchable apps, dialer, `startFocus`, `endFocus` |
| `VigilService.kt`                  | The AccessibilityService: hears which app is in front (window state changes only)                |
| `VigilGuard.kt`                    | The guard at work: what each level does, the 1-second tick, the hard stop                        |
| `VigilPolicy.kt`                   | The rules, free of Android calls: classify the app in front, Imperium's turns, time format       |
| `VigilReturner.kt`                 | Brings Vinco back (debounced 400 ms, a few follow-up tries, never a loop)                        |
| `VigilOverlay.kt`, `VigilViews.kt` | The windows over other apps: the notice card, the draggable bubble, the panel's window, motion   |
| `VigilPanel.kt`                    | The focus panel a tap on the bubble opens (layout plan at the top of the file), its companions   |
| `VigilTheme.kt`, `VigilGlyphs.kt`  | The overlays' palette (from the app) and type (bundled fonts, capped font scale); laurel, ring   |
| `VigilCopy.kt`                     | The overlay words: fallbacks for the keys the app sends (`src/copy/focus.ts` `overlay`)          |
| `VigilStore.kt`                    | SharedPreferences `vinco.vigil`: the session, the overlay words, Imperium's per-app turns        |
| `VigilApps.kt`                     | Launchable apps (96 px PNG icons), the dialer, launchers, keyboards, always-allowed packages     |

**How each level works:**

- **Custos (Level I, Watch):**
  - An app outside the focus comes to the front: a short alert card ("Focus is on") and a `nudge` event.
  - A small floating bubble shows the time left (`m:ss`, or `h:mm` from an hour) whenever Vinco isn't in front. It can be dragged and snaps to the nearer side; the place is kept for the session. A tap opens the focus panel (below), never Vinco straight away.
  - Every 3 minutes in apps outside the focus: a "Back to the line" card with an "Open Vinco" button, and a `nudge` event.
- **Imperium (Level II, Limit):**
  - An app outside the focus opens: the alert card and a red countdown bubble ("Closes in 2:41").
  - At 3 minutes: Home, then Vinco to the front, and an `appClosed` event.
  - The app then rests for 3 minutes: opening it sends the user straight back to Vinco with "Resting. Opens again in 1:20", and an `appBlocked` event.
  - The turns are kept per app in the store, so leaving and coming back doesn't reset the 3 minutes.
- **Silentium (Level III, Lockdown):**
  - Anything outside the focus (the home screen and recents included) brings Vinco back at once, with an `appBlocked` event.
  - The notification shade is closed (`GLOBAL_ACTION_DISMISS_NOTIFICATION_SHADE` on Android 12+, Back before).
  - Back inside Vinco: under Silentium `useFocusLock` swallows Back and the back gesture on the active focus screen.

**Safety rules (never break these):**

- **Always allowed, whatever the list says:** Vinco, the default dialer (`TelecomManager`), the in-call screen and telecom service, the emergency dialer and emergency tools, the permission pages, system dialogs (`android`), and keyboards (their windows never count as an app in front, so typing always works).
- **Calls win:** while a call rings or is under way (the audio mode is ringtone, in call or in communication), the guard does nothing at all.
- **The power menu and the lock screen** are never touched (emergency calls live there on many phones).
- **Hard stop:** the session is cleared once the wall clock reaches `endsAt`, or (on the same boot) once the measured time does. Checked on every event, every second, and by a timer set for `endsAt`. `startFocus` never accepts more than 3 hours and a minute from the moment it is called. `endFocus` clears it at once.
- **Reboots and a closed app:** the session lives in SharedPreferences. The system restarts the accessibility service after a reboot or when Vinco's process dies; the service reads the session on connecting and carries on, or clears it if it is over.
- **No overlay permission:** the windows fall back to the accessibility overlay the service may draw; if that fails too, there are no windows, but Imperium and Silentium still send the user back to Vinco. Taken away mid-focus: the next second the bubble is drawn again with the other window type, and an open panel closes.
- **Calls hide the windows:** a call ringing or under way removes the card, the bubble and the panel at once (on the window event or the next second); they come back after the call.
- **Never over Vinco:** the bubble and the panel hide as soon as Vinco is in front; the panel also closes when another app comes to the front (Home pressed with it open).

**Permissions and the Play Store:**

- **Accessibility** (the guard service, `BIND_ACCESSIBILITY_SERVICE`): turned on by the user in the phone's accessibility settings (`openPermissionSettings('accessibility')`). Since 1 Nov the service also hears scrolls and has `canRetrieveWindowContent` true, for the reel counter only (see "The reel counter", privacy). Its description (`vigil_service_description`) names both jobs: guarding the focus sessions the user starts, and counting reels in the marked apps.
- **Display over other apps** (`SYSTEM_ALERT_WINDOW`): `openPermissionSettings('overlay')`.
- **Package visibility:** a `<queries>` element for launcher apps, the home screen and keyboards. Never `QUERY_ALL_PACKAGES`.
- **Play declaration (release task):** the Accessibility API declaration in Play Console for focus blocking, with a short video of the disclosure, the permission being turned on, and a focus at work.
- **Prominent disclosure (step E):** before sending the user to the accessibility settings, an in-app screen must say in plain words what the service sees (which app is in front), what it does (the guard's actions during a focus the user starts), that nothing is read from the screen or sent off the phone, and ask for consent with a clear button. It can't be buried in the terms.

**The overlays' design (1 Nov):** Vinco's design language, not Android's. The look comes from the app: `startFocus` sends the active palette's roles and scheme (`theme`, from `focusOverlayTheme(useTheme())` in `useFocus`; `colors` and `scheme` in the native config), so Nox, Basalt, Marble and the rest all match; anything missing keeps Basalt. Every window is the palette's surface with a hairline border and rounded corners, Marcellus for the one title, Figtree for the rest, the time in tabular figures. Marcellus and Figtree ship inside the module (`res/font`, about 125 KB), because the app's fonts load at runtime from the JavaScript bundle, which the guard service can't reach; the system sans is the fallback. Text follows the phone's font size, capped at 1.3 times; the panel's time shrinks to fit (down to half) so "2:59:59" never clips. Motion: cards and the panel fade in with a small scale and slide (220 to 240 ms) and leave in 180 ms, the bubble pops in and glides to a side when let go; the system's animator scale applies. A light haptic tick on a card, the panel and every button, where the phone allows it.

- **Alert** (Custos and Imperium, an app outside the focus): the laurel mark, "Focus is on", one line, then "Back to focus" (gold) and "Not now" (quiet). Leaves after 6 s.
- **Nudge** (Custos, every 3 minutes outside): "Back to the line", one line, the same two actions. Leaves after 15 s.
- **Countdown bubble** (Imperium): "Closes in 2:41" in a pill; it turns porphyry in the last 30 seconds (closing).
- **Rest notice** (Imperium, an app still resting): "This app is resting", "Opens again in" and the time in porphyry. No actions (Vinco is coming back); touches pass through.
- **Timer bubble** (Custos): the laurel and the time left in a pill with a gold hairline.
- **Silentium** shows no window over other apps: Vinco comes straight back, and its own focus screen says why.
- "Back to focus" and "Open Vinco" open `vinco://focus` (the focus screen); if the link can't be opened, Vinco's front screen.

**The focus panel** (`VigilPanel.kt`): a tap on the bubble (Custos, or Imperium's countdown) opens one card on a scrim: the laurel and "Focus" with the guard's chip ("Custos" · Level I), a thin ring of the session still to run with the time left large (`h:mm`, the seconds smaller), "Ends 7:40 pm" (the phone's 12 or 24 hour format), under Imperium "Closes in 2:41" for the app in front, then the companions as icons (the Phone app first; a tap opens the app) and "Close" (quiet) and "Open Vinco" (gold). It updates every second; a tap outside, Back or Close dismiss it to the bubble. Short screens (landscape) get a smaller ring and the card scrolls. Repeated taps on the bubble or the buttons do nothing more than the first.

**Android's accessibility shortcut bubble:** turning on an accessibility service, Android 11 and later may offer a "shortcut" for it, and on some phones it is switched on by default: a small floating accessibility button over every app that only turns the service on and off. It is the system's, not Vinco's: the service never asks for it (`accessibilityFlags` is `flagDefault`, no `flagRequestAccessibilityButton`, and no `AccessibilityButtonController` anywhere). The permission notice says how to remove it: Settings, Accessibility, Vinco focus guard, Shortcut.

**Testing on the phone:**

1. New native code needs a new development build: `npx eas-cli@latest build -p android --profile development`, install it, then `npx expo start`.
2. Phone settings, Accessibility, "Vinco focus guard": turn it on. Settings, Apps, Vinco, "Display over other apps": allow (also try once without it).
3. Start a short focus (5 minutes) with each guard. Until step E passes the Comites, only the always-allowed apps are allowed.
4. Custos: open another app: the alert, the bubble (drag it to the other side, let go: it snaps; tap it: the panel, with the time ticking; Back, a tap outside and Close each dismiss it; a companion icon opens that app; Open Vinco opens the focus screen), and after 3 minutes the popup. Try it in dark and light palettes, with the largest font size, and rotated in an app that turns.
5. Imperium: open another app and wait 3 minutes: back to Vinco. Open it again at once: back again with the resting notice. After 3 minutes it opens.
6. Silentium: press Home, open recents, pull the shade, open another app: Vinco comes back each time. Call the phone from another phone and answer: nothing interferes. Open the dialer: allowed.
7. Kill Vinco from recents during a focus (Custos): the guard carries on. Restart the phone during a focus: it carries on after unlocking and stops at the end time.
8. Let a focus run out: the bubble and every guard stop at the end, even with Vinco closed.

Compile check on the PC (needs Android Studio's JDK and the Android SDK): `npx expo prebuild -p android --no-install` (the `android/` folder is generated and gitignored), add `android/local.properties` with `sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk`, set `JAVA_HOME` to Android Studio's `jbr`, then from `android/`: `.\gradlew.bat :vigil:compileDebugKotlin`.

## The reel counter (built, 1 Nov)

The Vigil counts reels and shorts in the marked apps, per local day, in the same accessibility service as the focus guard. Everything stays on the phone; nothing is sent anywhere.

### Levels as built

| Level            | Counts | Badge | Milestone cards | Past the allowance      | Later                                       |
| ---------------- | ------ | ----- | --------------- | ----------------------- | ------------------------------------------- |
| Pax              | yes    | no    | no              | nothing                 |                                             |
| Vigil            | yes    | yes   | yes             | blocking card, closable |                                             |
| Custos (`guard`) | yes    | yes   | yes             | blocking card, no close | the "why are you opening this?" check (1.1) |
| Imperium         | yes    | yes   | yes             | blocking card, no close | blocking the app itself, Clementia (1.2)    |

**Allowance** = the daily budget plus 12 reels for each **reel pass** bought today.

- **Badge** (Vigil and up, 1 Nov, `VigilBadge.kt`): a small pill ("12 reels", tabular digits) while a marked app is in front, every time it comes back (after Home, Recents, a lock, or a blocking card left on screen; see "Which app is in front" below). Marble below 80% of the allowance, gold from 80% up to it, porphyry past it. **Draggable** (past an 8 dp touch slop; on release it glides to the nearer side) and **tappable** (a tap, not a drag, opens the panel). Its side and height are kept in prefs (`badgeStart`, `badgeY`) and clamped into the screen again on rotation or a size change. Hidden as soon as another app (or Vinco) comes to the front.
- **Panel** (a tap on the badge, `VigilReelCards.kt`): one card on a scrim, like the focus panel: "REELS TODAY", a thin ring with the count, "18 of 30", the passes used if any, one gold "Reel pass +12 · 20 denarii", and a quiet Close. With the three passes used, or too few denarii, the button becomes one muted line. Scrim, Back and Close dismiss it.
- **Budget and milestone cards** (Vigil and up): at the allowance ("Budget reached") and at every 25 **under** it; the allowance wins a tie. A notice card near the top with the tone's line and Close; it goes when the user leaves the app, or after 60 seconds.
- **Blocking card** (Vigil and up): on **every** reel counted past the allowance. A full-screen scrim (the feed below can't scroll) with the count, the tone's line, gold "Leave" (home screen via `GLOBAL_ACTION_HOME`), a quiet "Reel pass +12 · 20 denarii" (hidden when the three are used or the denarii fall short) and, at Vigil only, a quiet "Close" (scrim and Back close it too). At Custos and Imperium there is no close: Back means Leave. One at a time: a new reel refreshes the card in place (a live region reads the new count). It supersedes the milestone cards past the allowance.
- **Reel pass** (1 Nov): +12 reels over today's budget for **20 denarii**, at most **3 a day**, reset at midnight. Denarii only, never real money. Bought in Vinco only (the ledger has one writer): the panel and the blocking card open `vinco://reels?pass=1`, which opens /reels with the confirm sheet. The new allowance reaches the phone through `configure` (`passDay`, `passes`), and the blocking card goes as soon as the count is under it again.
- **Not built yet:** the old Tributum rules in `guard.ts` (doubling price) are superseded by the pass and unused; the "under budget" 3 denarii; a picker for extra marked apps.
- Rules live in `src/features/guard/reels.ts` (`getReelStepIn`, `getReelBadgeStage`) and `reelPass.ts` (price, limit, allowance, block mode), tested, and are mirrored in Kotlin `VigilReelPolicy.kt` and `VigilReelConfig`: keep the two in step.

### Detection

- **Signals:** `TYPE_VIEW_SCROLLED` from a marked package (any other package is dropped on the first line, O(1)). The event gives the list's first and last visible item (`fromIndex`, `toIndex`), the item count and, on Android 9+, the scroll deltas. Since 2 Nov also `TYPE_WINDOW_CONTENT_CHANGED` (subtree changes of a list or pager), turned on at run time **only while a marked app whose rule asks for it is in front** (`setServiceInfo`), for pagers that page without scroll events.
- **Two paths, one count** (`VigilReelDetector.kt`):
  1. **Positions** (Instagram, and any list that reports them): a reels pager settles on one item (`fromIndex == toIndex`) and either has a known resource id or fills most of the screen (at least 90% of the width and 75% of the height). Sideways scrolls (tabs, the stories tray) are ignored.
  2. **At rest** (2 Nov, `VigilReelSettler.kt`, `VigilReelPages.kt`): any other swipe (or run of content changes) in a list of a marked app is read once, **300 ms after its last event** (a run of content changes at the latest every 1.5 s). The page covering the pager's centre must fill at least 90% of it (one item at a time: a feed never counts), and the pager must not be sideways. Its place is, in order: the page's own position in the list (`rowIndex`, which RecyclerView and ViewPager2 report per item even when the scroll event has none); a new page view (Snapchat, `byPageIdentity`); the distance swiped in pager heights (`byDistance`: under half a height is a nudge, a fling of three heights is three places). Each gesture is judged on its own, so a lost scroll event never drifts the count. A gesture whose scrolls reported positions is never counted by distance or view (no double count); a pager counted by position on both paths shares one track.
- **A reel counts** when the user settles on a place further down than any counted before in that pager and stays on it **1.2 seconds** (one delayed check, no polling). So flinging past reels counts only the ones stayed on; scrolling back up never counts again (the highest counted place is remembered for the last 8 pagers, so going from the feed to Reels and back doesn't start over); leaving the app, or a new swipe in the same list, inside the 1.2 s cancels it. Idle playback never counts: the same page at rest is the same place.
- **First reel:** when a pager is first seen on a forward swipe, the reel swiped from counts at once. A pager first seen at rest (YouTube or Snapchat opened on a reel) counts that reel after its dwell. On the positions path a reel opened and left without any swipe is not counted.
- **Rule table:** `VigilReelRules.kt`, one line per app, easy to update when an app changes:

| App       | Package(s)                                                                                       | Rule                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Instagram | `com.instagram.android`                                                                          | id `clips_viewer_view_pager`, then fallback; positions path only (its home feed is never read at rest)               |
| YouTube   | `com.google.android.youtube`; ReVanced `app.revanced.android.youtube`, `app.rvx.android.youtube` | pager id `reel_recycler`, page id `reel_player_page_container`, then fallback; at rest, by distance, content changes |
| TikTok    | `com.zhiliaoapp.musically`, `com.ss.android.ugc.trill`                                           | fallback; at rest, by distance, content changes                                                                      |
| Facebook  | `com.facebook.katana`                                                                            | fallback; at rest, by distance, content changes                                                                      |
| Snapchat  | `com.snapchat.android`                                                                           | fallback; at rest, by page view, by distance, content changes (any view class)                                       |
| Any other | passed to `configure` (no picker in the UI yet)                                                  | fallback; at rest by position only                                                                                   |

**Why YouTube Shorts and Snapchat counted nothing before 2 Nov:** the old detector needed `fromIndex == toIndex` on a scroll event, and only TikTok could fall back to distance. Shorts' pager and Snapchat's custom views send scrolls without item positions (or none at all), so every swipe was dropped. The at-rest path reads the page's position, view or distance instead.

The default list is `REEL_APPS` in `src/features/guard/reels.ts`. The ids come from public knowledge of these apps and **must be confirmed on a phone** (Android Studio's Layout Inspector or `adb shell uiautomator dump`); the fallback keeps counting if they change.

### Known limits

- **Instagram:** the home feed is also a vertical list; it counts only if it settles on a single post filling most of the screen (rare). If a new version's Reels viewer stops sending scroll events, nothing counts until the rule changes.
- **YouTube:** Shorts opened from the home shelf use the same player. The regular watch page is not a pager.
- **TikTok:** ids change with every release, so it relies on the fallback and, without positions, on distance. The comments sheet is not full screen, so it doesn't count.
- **Facebook and Snapchat:** custom views that may not report positions. Snapchat by page view is a fair guess: pagers reuse 3 to 5 views, so without a scroll delta a view seen two places back reads as new (a back swipe of two may count once). If nothing counts, find the pager's id with `uiautomator dump` and add it to the table.
- **Content changes:** while YouTube, TikTok, Facebook or Snapchat is in front the service hears content changes (dropped unless a list's or pager's subtree changed); everywhere else they stay off. At most one look at the screen every 250 ms, usually one per swipe.
- **Split screen:** only apps matched by id count (a half-screen pager fails the size check). **Picture-in-picture** plays no new reels. **Landscape** works (the screen size is read at each check).
- **Screen locked inside the 1.2 s:** that reel still counts (no event tells the lock apart).
- **Renamed packages:** a renamed package is simply not counted until the list changes.

### Counting and storage

- **Native store:** SharedPreferences `vinco.vigil.reels` (`VigilReelStore.kt`), apart from `vinco.vigil` (which a focus ending clears). Today's count is a plain int (O(1) per reel); past days sit in a small JSON object, the last 60 kept. The day is the local `yyyy-MM-dd` at the moment of counting, so midnight starts at 0, and a clock or time zone change counts into the day it now is (a day seen before resumes). It survives Vinco being closed and reboots.
- **Settings:** `configure` stores the level, budget, packages, the pass (`passDay`, `passes`, `denarii`, `passPrice`, `passReels`, `passMax`), and the overlay words and colours there too; nothing is counted until the app has sent them once. The service reloads them at once. Passes count only when `passDay` is the phone's today, so midnight resets them with the count.
- **Which day:** reel counts and passes belong to the **reel day**, the phone's own date (`useReelDay()`), because the native counter keys by the phone's clock. With the dev clock ahead the app's day moves on but the reel day does not.
- **Passes in the ledger:** one row per pass, reason `reel_pass_1` to `reel_pass_3`, amount -20, on the reel day; (day, reason) is unique, so a fourth can never be written. `buyReelPass` (`src/db/reels.ts`) is one transaction, idempotent (it takes the count the user confirmed against, so a double tap buys once) and never below zero. Every balance already sums the ledger, so nothing else changed. No migration.
- **JavaScript:** `useReelWatch()` (mounted in the root layout) sends `configure` when the level, budget, tone or palette changes, and copies the native days into SQLite `reel_days` (migration `0014_reel_days`: `day` primary key, `count`, `updated_at`) on launch, on return to the front and on every `onReel`. Native stays the source of truth for today. `useReelCount()` reads today and yesterday from the table (live).
- **Bridge:** `GuardBridge` gained `canCountReels` and `getReelDays()`, and `configure` takes optional `copy` and `colors` (`ReelWatchConfig`, `src/features/guard/reelBridge.ts`). A development build from before 1 Nov lacks the native functions: the bridge then keeps the stub's reel members.
- **Reels screen (`/reels`, 1 Nov):** from the Reels tile on Today and the guard screen's "Reels today" row. Today as one big number against the allowance with a thin bar, what is left, the passes; "Reel pass +12" once near or past the allowance (Vigil and up). The log: Day (a bar a day for a week) or Week (a bar a week for eight weeks), each bar muted within the allowance and porphyry past it, the budget as a dashed gold line (`PeriodBarChart` `reference`). Settings: the guard level (segmented, one line on what happens past the budget), the daily budget, the apps counted, and a link to all guard levels. With Expo Go, one quiet line; with the service off, one row that opens /permissions (the disclosure comes before the phone settings).
- **Guard screen:** "Reels today" is a compact row ("12 of 30", coloured like the badge) that opens /reels. In Expo Go the preview notice stays.
- **Service off:** counts stay, nothing new is counted, the guard screen says the counter is off.
- **Which app is in front** (2 Nov, `VigilReelFront.kt`): window state events first; then, after any window list change (`TYPE_WINDOWS_CHANGED`, once per 250 ms burst) or an event from a marked app that isn't the one in front, the top application window's package is read from the window list (`flagRetrieveInteractiveWindows`) and wins. This fixed the badge not coming back: the blocking card is a focusable window over everything, so leaving with it on screen (Home, Recents) could leave the app in front stale, and some phones send no state event when an app returns from Recents. The badge also forgets its view when the system removes its window, so the next show adds a new one instead of styling a view that is gone.
- **Errors:** every event is handled inside a try/catch in `VigilService` (the service runs in Vinco's process: an exception would close the app), and a reel error never keeps the focus guard from hearing a window. Every WindowManager call is on the main thread and wrapped.
- **A focus at the same time:** both run. The badge sits top left, the focus bubble top right; Imperium and Silentium sending the user back to Vinco hide the badge.

### Privacy and the Play declaration

- `vigil_accessibility.xml`: `typeWindowStateChanged|typeWindowsChanged|typeViewScrolled` (content changes added at run time, in the marked apps that need them), `flagReportViewIds|flagRetrieveInteractiveWindows`, `canRetrieveWindowContent` **true**. Why: to tell the reels pager from a normal feed, the counter reads, in a marked app only, the list's **resource id, bounds and scroll positions, and the bounds, id and list position of the page on its centre** (at most 6 children; for YouTube, a search of the app's own views by the rule's ids). The window list gives only the top app's package name. It never reads text, content descriptions, usernames, captions, messages or video, and logs nothing; nodes are released at once. Only the number of reels a day is stored.
- **Declaration text (Play Console):** "Vinco uses the Accessibility API to count short-form videos (reels) the user watches in apps they choose, and to guard focus sessions the user starts. For reels it detects when a new full-screen video scrolls into view, using only the scrolling list's id, size and position. No screen content is read, stored or transmitted." The video shows the guard screen's disclosure, turning the service on, a few reels counted in Instagram, and the badge.
- **Disclosure copy updated:** `guardCopy.reels.offBody` (the guard screen), `focusCopy.permission.watches` and `stays` (the focus setup), `permissionsCopy.items.overlay.why`, and the service description (`vigil_strings.xml`).

### Testing the reel counter on the phone

1. New native code: build a new development build (`npx eas-cli@latest build -p android --profile development`), install it, `npx expo start`.
2. Turn on "Vinco focus guard" in Accessibility (the guard screen's button). User menu, Guard: "Reels today" shows 0 of 30.
3. **Pax:** in Instagram Reels, swipe 5 reels staying 2 s on each. Back in Vinco the count is 5 (6 if the first swipe started from a reel). No badge.
4. **Vigil:** set the level and a budget of 5. Reopen Instagram Reels: the badge shows; it turns gold at 4, the "Budget reached" card shows at 5, porphyry from 6 and the blocking card on every reel from 6 (one card, the count refreshing). Close works; Leave goes home.
   4a. **Badge:** drag it to the other side and up: it glides to the edge; leave and reopen the app: it is where it was left. Rotate: it stays inside the screen. A tap (no drag) opens the panel; scrim, Back and Close dismiss it.
   4b. **Pass:** with 20 or more denarii (dev "Add denarii"), tap "Reel pass" on the panel or the blocking card: Vinco opens on /reels with the sheet; buy; back in the app the badge reads "of 17" and no card shows until reel 18. Buy three: the button is replaced by "All 3 passes used today". With under 20 denarii the pass is hidden on the blocking card and a muted line shows on the panel.
   4c. **Custos / Imperium:** the blocking card has no Close; Back and a scrim tap don't dismiss it (Back goes home).
   4d. **Light palette** (Marble) and a large font size: the panel and card read well; the card scrolls on a short landscape screen.
5. Fling fast past 5 reels: only the one stayed on counts. Scroll back up 3: no count. Scroll down again over the same 3: no count.
6. Repeat 3 to 5 in **YouTube Shorts**, **TikTok**, **Facebook Reels** and **Snapchat Spotlight**. Note per app: right, double counts, or none (then fix the rule table). Expected since 2 Nov: one per reel stayed on; opening Shorts on a short and staying 2 s counts it; one short looping for a minute adds nothing; a small drag that springs back adds nothing; up 2 and down 2 adds nothing.
   6a. **Snapchat Stories** (sideways) and the **Shorts shelf** on YouTube home (sideways): nothing counts. YouTube home feed scrolled for a minute: nothing.
   6b. **Badge comes back** (Vigil, budget 1, so the blocking card shows): with the card on screen press Home, then open Instagram from its icon: the badge is back with the count. Repeat leaving by Recents (then pick Instagram there), by Back at Custos, by locking the screen (unlock straight into Instagram), and by "Leave". Repeat in Shorts and Spotlight.
   6c. With the badge showing, pull down the notification shade and open the keyboard in Instagram search: the badge stays.
7. Scroll the Instagram home feed and YouTube home for a minute: the count must not move.
8. Split screen (Instagram plus another app), Shorts in landscape, a picture-in-picture video.
9. Kill Vinco, watch 3 reels, reopen: the count includes them. Reboot: the count is kept. After midnight: a new day at 0, and yesterday shows.
10. Start a Custos focus and open Instagram: the focus bubble and the badge both show.
11. Turn the service off: the guard screen says the counter is off; the count so far stays.

### Are you up? (wake prompt, 1 Nov)

When the user unlocks the phone between **03:00 and 12:00** (local time) and today's wake-up isn't logged, Vinco posts one quiet notification: "Are you up?". Tapping it opens Today on the wake-up flow (`vinco://veni?wake=1`).

- **Needs the guard service.** Since Android 8 an app can't hear unlocks (`ACTION_USER_PRESENT`) from the manifest; a running component must register for them. The Vigil's accessibility service already runs whenever the user turned it on, so it registers the unlock receiver in `onServiceConnected` and drops it in `onUnbind` / `onDestroy`. With the service off the prompt simply doesn't fire. No foreground service is added for it.
- **The rule** (`VigilWake.onUnlock`, mirrored and tested in `src/features/guard/wakeWatch.ts` `shouldPromptWake`): the watch is on, the time is in the window (`WAKE_PROMPT`), `awakeDay` isn't today, no prompt was posted today (`promptedDay`), and notifications are allowed. At most **once per local day**. The only work on an unlock is one SharedPreferences read.
- **The watch** lives in its own prefs file, `vinco.vigil.wake` (apart from `vinco.vigil`, which a focus ending clears): enabled, window, `awakeDay`, `promptedDay`, title, body, channel name.
- **The app keeps it in step** with `useWakeWatch()` (mounted in the tabs layout), through `guardBridge.setWakeWatch({ enabled, awakeDay, copy })`. On while the active arc has the wake-up order and reminders are on. `awakeDay` is today once wake-up is logged (`amounts.wake > 0` or `wokeAt`) or a sick-day Truce is called; logging it also clears a prompt still on screen. Sent only when something changed.
- **Notification:** channel `vinco.wake` ("Wake-up check"), default importance, no full-screen, auto-cancels on tap, same small icon as Aurora. It may post during a focus.
- Copy: `notificationsCopy.wakePrompt` (three tones).

### Testing Aurora on the phone

1. Build once (cloud): `npx eas-cli@latest build -p android --profile development`. Install the APK from the link.
2. On the PC: `npx expo start`. On the phone: open Vinco (the development build) and pick the PC's server.
3. User menu, Aurora: turn it on. Allow exact alarms, full-screen alarm (Android 14+) and notifications in the "On this phone" card.
4. "Test the alarm in 1 minute", then lock the phone. It rings over the lock screen at full alarm volume; the back button does nothing; 30 steps (or 30 swings with Gladius, or taps) stop it and pay the first-try denarii; the alarm volume is back to where it was.
5. Try "I'm sick" (with and without a Truce) and an alarm pass from the Forum.
6. Reboot: "Next ring" is still set.

A `preview` build (`--profile preview`) is the same app without the PC, for living with it day to day.

### Order of work

1. Development build and the empty local modules (half a day).
2. Aurora: scheduling, the alarm screen and the march mission (the simplest), then sky and post.
3. The Vigil: counting in Pax, then the badge (Vigil level), milestone cards (built 1 Nov; next: the marked-app picker, the tap panel, the Tributum).
4. Guard dialogues (1.1), Imperium (1.2).
5. App icon switching (the Forum's icons) can ride on the same development build: `expo-alternate-app-icons` or a small module with activity aliases.
