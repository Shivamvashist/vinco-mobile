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

- An alarm at the planned wake-up time on chosen days. It stops only after a **mission**: **see the sky** (a photo of daylight, checked on the phone), **reach the post** (scan a QR code stuck in the bathroom), or **march** (30 steps).
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
- **Missions:** sky (camera plus a brightness and colour check on the phone), post (barcode scanning with `expo-camera`), march (step counter via `expo-sensors` Pedometer).
- `AuroraBridge` (`src/features/aurora/bridge.ts`) is the contract: `schedule`, `cancel`, `canScheduleExact`, `openExactAlarmSettings`.

### Aurora as built (31 Oct)

- **Native module:** `modules/aurora` (Kotlin), behind `auroraBridge` (the stub stays for Expo Go and Jest).
- **Permission:** `SCHEDULE_EXACT_ALARM`, with an inexact fallback if refused.
- **The ring:** a foreground service loops the alarm sound on the alarm stream, and a full-screen notification on the `aurora` channel opens `vinco://alarm`. There is no snooze. It stops itself after 10 minutes.
- **The phone keeps the rule:** the repeat rule lives on the phone (SharedPreferences), so the next ring is set after a ring, a reboot, an update or a clock change, without opening the app.
- **Ring screen `/alarm`:**
  - **March:** 30 steps, or 30 taps without a step counter.
  - **"I'm sick":** the sick-day Truce; if it can't be paid, the alarm keeps ringing.
  - **"Use an alarm pass".**
  - **First try:** logs wake-up and pays 2 denarii.
- **Not built yet:** "See the sky" and "Reach the post" are marked as coming; they ring with the march until built.

## Focus ("Acies") and the guard (31 Oct)

A focus is a timed stretch with a guard on the phone (spec: [TODAY-AND-FOCUS.md](TODAY-AND-FOCUS.md) section 4, and wave 5 in [TASKS-2026-10-31-wave5.md](TASKS-2026-10-31-wave5.md) sections 5 and 7). The timer, the session record and the reward work in every build; the guards need the development build (see "Focus guards (built)" below).

| Guard                             | What the phone does during the focus                                        | Rate (denarii a minute) |
| --------------------------------- | --------------------------------------------------------------------------- | ----------------------- |
| "Custos" (Watch, Level I)         | An alert, a floating timer, a "back to the line" popup every 3 minutes      | 0.2                     |
| "Imperium" (Limit, Level II)      | 3 minutes in an app outside the focus, then back to Vinco and 3 minutes off | 0.3                     |
| "Silentium" (Lockdown, Level III) | Only Vinco, the Comites and the Phone app                                   | 0.4                     |

- **Bridge calls** (`GuardBridge`, `src/features/guard/bridge.ts`):
  - `startFocus({ guard, startedAt, endsAt, allowedPackages, copy? })`: called when a focus begins. The module guards until `endsAt` on its own, even if Vinco is killed.
  - `endFocus()`: called when the focus completes or is given up. Safe to call when no focus is on.
  - `onFocusEvent(listener)`: `nudge`, `appBlocked`, `appClosed`, each with the package (or null).
  - The stub does nothing; errors from the module are logged in dev and never stop the timer or the reward.
- **Without the module** (`guardBridge.isSupported` false, Expo Go or an older build), the focus runs with the timer and the reward, and the setup screen says blocking is off.
- **Measured time:** the module keeps its own hard stop on `SystemClock.elapsedRealtime()` within one boot, so moving the clock back can't stretch the guard. The JS side's own check still only runs while Vinco stays open (TODAY-AND-FOCUS.md "Focus as built").

### Focus guards (built, 31 Oct)

The local module `modules/vigil` (Kotlin, module name `VincoVigil`) sits behind `guardBridge`. Expo Go, iOS and Jest get `unsupportedGuardBridge` (nothing throws, nothing is granted); `selectGuardBridge` picks the module when it is built in. Reel counting (`configure`, `getTodayCount`, `onReel`) is not native yet and keeps the stub's answers.

**Pieces (`modules/vigil/android/src/main/java/expo/modules/vigil/`):**

| File                               | Job                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `VigilModule.kt`                   | The JS functions: permissions, settings pages, launchable apps, dialer, `startFocus`, `endFocus` |
| `VigilService.kt`                  | The AccessibilityService: hears which app is in front (window state changes only)                |
| `VigilGuard.kt`                    | The guard at work: what each level does, the 1-second tick, the hard stop                        |
| `VigilPolicy.kt`                   | The rules, free of Android calls: classify the app in front, Imperium's turns, time format       |
| `VigilReturner.kt`                 | Brings Vinco back (debounced 400 ms, a few follow-up tries, never a loop)                        |
| `VigilOverlay.kt`, `VigilViews.kt` | The windows over other apps: the card and the draggable bubble                                   |
| `VigilStore.kt`                    | SharedPreferences `vinco.vigil`: the session, the overlay words, Imperium's per-app turns        |
| `VigilApps.kt`                     | Launchable apps (96 px PNG icons), the dialer, launchers, keyboards, always-allowed packages     |

**How each level works:**

- **Custos (Level I, Watch):**
  - An app outside the focus comes to the front: a short alert card ("Focus is on") and a `nudge` event.
  - A small floating bubble shows the time left (`m:ss`, or `h:mm` from an hour) whenever Vinco isn't in front. It can be dragged; a tap opens Vinco.
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
- **No overlay permission:** the windows fall back to the accessibility overlay the service may draw; if that fails too, there are no windows, but Imperium and Silentium still send the user back to Vinco.

**Permissions and the Play Store:**

- **Accessibility** (the guard service, `BIND_ACCESSIBILITY_SERVICE`): turned on by the user in the phone's accessibility settings (`openPermissionSettings('accessibility')`). The service reads window state changes only (`canRetrieveWindowContent` false). Its description (`vigil_service_description`) says it is used only to guard the focus sessions the user starts.
- **Display over other apps** (`SYSTEM_ALERT_WINDOW`): `openPermissionSettings('overlay')`.
- **Package visibility:** a `<queries>` element for launcher apps, the home screen and keyboards. Never `QUERY_ALL_PACKAGES`.
- **Play declaration (release task):** the Accessibility API declaration in Play Console for focus blocking, with a short video of the disclosure, the permission being turned on, and a focus at work.
- **Prominent disclosure (step E):** before sending the user to the accessibility settings, an in-app screen must say in plain words what the service sees (which app is in front), what it does (the guard's actions during a focus the user starts), that nothing is read from the screen or sent off the phone, and ask for consent with a clear button. It can't be buried in the terms.

**Testing on the phone:**

1. New native code needs a new development build: `npx eas-cli@latest build -p android --profile development`, install it, then `npx expo start`.
2. Phone settings, Accessibility, "Vinco focus guard": turn it on. Settings, Apps, Vinco, "Display over other apps": allow (also try once without it).
3. Start a short focus (5 minutes) with each guard. Until step E passes the Comites, only the always-allowed apps are allowed.
4. Custos: open another app: the alert, the bubble (drag it, tap it), and after 3 minutes the popup.
5. Imperium: open another app and wait 3 minutes: back to Vinco. Open it again at once: back again with the resting notice. After 3 minutes it opens.
6. Silentium: press Home, open recents, pull the shade, open another app: Vinco comes back each time. Call the phone from another phone and answer: nothing interferes. Open the dialer: allowed.
7. Kill Vinco from recents during a focus (Custos): the guard carries on. Restart the phone during a focus: it carries on after unlocking and stops at the end time.
8. Let a focus run out: the bubble and every guard stop at the end, even with Vinco closed.

Compile check on the PC (needs Android Studio's JDK and the Android SDK): `npx expo prebuild -p android --no-install` (the `android/` folder is generated and gitignored), add `android/local.properties` with `sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk`, set `JAVA_HOME` to Android Studio's `jbr`, then from `android/`: `.\gradlew.bat :vigil:compileDebugKotlin`.

### Testing Aurora on the phone

1. Build once (cloud): `npx eas-cli@latest build -p android --profile development`. Install the APK from the link.
2. On the PC: `npx expo start`. On the phone: open Vinco (the development build) and pick the PC's server.
3. User menu, Aurora: turn it on. Allow exact alarms, full-screen alarm (Android 14+) and notifications in the "On this phone" card.
4. "Test the alarm in 1 minute", then lock the phone. It rings over the lock screen; the back button does nothing; 30 steps (or taps) stop it and pay the first-try denarii.
5. Try "I'm sick" (with and without a Truce) and an alarm pass from the Forum.
6. Reboot: "Next ring" is still set.

A `preview` build (`--profile preview`) is the same app without the PC, for living with it day to day.

### Order of work

1. Development build and the empty local modules (half a day).
2. Aurora: scheduling, the alarm screen and the march mission (the simplest), then sky and post.
3. The Vigil: counting in Pax, then the badge (Vigil level), milestone cards.
4. Guard dialogues (1.1), Imperium (1.2).
5. App icon switching (the Forum's icons) can ride on the same development build: `expo-alternate-app-icons` or a small module with activity aliases.
