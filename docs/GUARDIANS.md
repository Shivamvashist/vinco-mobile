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

### Order of work

1. Development build and the empty local modules (half a day).
2. Aurora: scheduling, the alarm screen and the march mission (the simplest), then sky and post.
3. The Vigil: counting in Pax, then the badge (Vigil level), milestone cards.
4. Guard dialogues (1.1), Imperium (1.2).
5. App icon switching (the Forum's icons) can ride on the same development build: `expo-alternate-app-icons` or a small module with activity aliases.
