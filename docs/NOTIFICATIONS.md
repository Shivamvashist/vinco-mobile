# Notifications

How Vinco reaches the user outside the app. Code follows this file; change it first if the rules change. Part of Wave 4 ([TASKS-2026-10-31.md](TASKS-2026-10-31.md), section 3).

**The promise:** at most three nudges a day, plus the alarm. A reminder only fires while there is something left to do; the moment its job is done, it is withdrawn.

## 1. Four kinds of notification

| Kind                  | Who sends it                                | Android channel | Status                                          |
| --------------------- | ------------------------------------------- | --------------- | ----------------------------------------------- |
| **Local reminders**   | The phone itself (`expo-notifications`)     | `reminders`     | Built (this file)                               |
| **Aurora, the alarm** | The native Aurora module (`modules/aurora`) | `aurora`        | Built by the Aurora work, not here. Not a nudge |
| **Are you up?**       | The native Vigil module (`modules/vigil`)   | `vinco.wake`    | Built (section 6a). Needs the guard service     |
| **Admin broadcasts**  | vinco-backend, through Expo's push service  | `announcements` | Later: token stored now, nothing sent yet       |

The alarm never counts toward the daily cap, and reminders never touch the alarm's schedule.

## 2. The default reminders

Every reminder opens Today (`/veni`), where its job is done. Times are the phone's local time.

| Kind (priority)       | When it fires                                            | Condition                                                                                                                          | Withdrawn when                      | Arcs                                      |
| --------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| 1. **Truce window**   | Wake time + 30 min (the morning slot)                    | Yesterday was missed, a Truce can still save the campaign, and the user can pay for it (reserve or denarii)                        | A Truce is called, or the day holds | Campaign only                             |
| 2. **Last call**      | 10:45 pm                                                 | The day doesn't hold yet and the campaign going into today is at least 2 days                                                      | The day holds                       | Campaign only                             |
| 3. **Seal the day**   | The user's evening time (default 8:30 pm, 4 pm to 10 pm) | The day doesn't hold yet. Says how many orders are left. When holding today pays a streak reward (the Stipendium), says so instead | The day holds                       | Campaign and free training (gentler copy) |
| 4. **Today's orders** | Wake time + 30 min                                       | Nothing logged yet today (wake-up included)                                                                                        | Anything is logged                  | Campaign and free training (gentler copy) |

- **The Truce window takes the morning slot:** on a day it fires, "Today's orders" doesn't. If the user switched the Truce window off, the morning reminder fires as usual.
- **No reminders at all on:** a sick-day Truce day, a day already held, a day with no orders, days outside the arc (before it starts or after a campaign ends), and before onboarding.
- **Free training:** morning and evening only, in gentle words; no last call, no Truce window (it has no Truces).
- **Streak ahead:** `getNextStreakReward` from `src/features/campaign/streak.ts`. When the next held day pays (days 3, 5 and 7 of each week of the run, the 14, 30, 60, 100 milestones, and in a campaign the Truce every 7th day), the evening line says "Hold today to earn 25 denarii and a Truce."

### Copy examples (Centurion; every line exists in all three tones in `src/copy/notifications.ts`)

| Kind           | Title                        | Body                                                                     |
| -------------- | ---------------------------- | ------------------------------------------------------------------------ |
| Today's orders | Orders are in, soldier       | 4 orders today. Open Vinco and log the first one.                        |
| Seal the day   | Seal the day                 | 2 orders still open. Finish them and seal the day.                       |
| Last call      | Last call, soldier           | Your 12-day campaign falls at midnight. Hold the line now.               |
| Truce window   | Call a Truce before midnight | Yesterday was missed. A Truce saves your 12-day campaign until midnight. |

Roast me examples: "Your phone is up. Are you?" / "Still scrolling? Seal the day". The humour rule holds: roast the scroll and the excuse, never the person, and every line ends with what to do. A missed day (the Truce window) stays calm in every tone, like the other slip screens.

## 3. The daily cap and priority

- At most **3 reminders a day** (`REMINDER_RULES.maxPerDay`), the alarm excluded.
- When more qualify, the highest priority wins: **Truce window, last call, seal the day, today's orders.** With the Truce window taking the morning slot, at most three can qualify today, so the cap is a safety net for kinds added later.

## 4. Quiet hours

No reminder from **11 pm until the planned wake time** (never later than noon, so a late riser still gets an afternoon). The evening time is kept between 4 pm and 10 pm, so it never meets the last call (10:45 pm).

## 5. How the plan is made and kept fresh

- **Pure planner** (`src/features/notifications/`, no Expo, tested):
  - `buildReminderDays(snapshot)`: today's real standing, then the next two days projected as if nothing gets logged (a day not held yet is projected as missed, so tomorrow may open on a Truce window).
  - `planReminders({ settings, days, now })`: each day's candidates, then the kind toggles, the past (dropped), quiet hours and the cap. Returns `{ id, kind, day, fireAt, url, message }`; the words come from `notificationsCopy.reminder(message, tone)`.
  - Fire times are built from the calendar day's parts (`atLocalTime`), so daylight saving never shifts 8:30 pm.
- **Scheduler** (`src/notifications/`, the only expo-notifications code): sets the foreground handler (listed quietly, no banner while the app is open), creates the channels, cancels **only Vinco's reminders** (ids starting `vinco.reminder.`) and schedules the plan with date triggers on the `reminders` channel.
- **`useReminderSchedule()`** (mounted once in `src/app/(tabs)/_layout.tsx`): rewrites the plan 1.5 s after anything it depends on settles (today's standing, orders, the arc, settings, tone, the day rolling over at midnight) and whenever the app returns to the foreground. Rewrites run one at a time. With reminders off, the permission refused, or the dev clock ahead of the real day, it cancels Vinco's reminders and schedules nothing.
- Planning three days ahead means reminders still arrive when the app isn't opened for a day or two. Each open rewrites them from the real records.
- Scheduled reminders survive a reboot (expo-notifications re-registers them).

## 6. Deep links

- Every notification carries `data.url`. Reminders use `/veni`; admin broadcasts may use `vinco://<screen>`.
- A tap opens that screen with `router.push`, Today with `router.navigate`. Cold starts are covered: `useLastNotificationResponse` returns the tap that launched the app, then the response is cleared so it is followed once.
- Only known screens open (`toNotificationPath`: Veni, Vidi, Vici, Settings, Permissions, Forum, Plan, Guard, Aurora). Anything else opens Today.

## 6a. Are you up? (wake prompt)

- **What:** on the first unlock between 03:00 and 12:00 with today's wake-up not logged, one notification "Are you up?" (three tones, `notificationsCopy.wakePrompt`). A tap opens `vinco://veni?wake=1`, Today's wake-up flow.
- **Who sends it:** the native Vigil module (`modules/vigil`, `VigilWake.kt`), not expo-notifications, on its own channel `vinco.wake` (default importance). It is only heard while the **guard service** (the Vigil's accessibility service) is on; without it, nothing fires. Detail in [GUARDIANS.md](GUARDIANS.md) "Are you up? (wake prompt)".
- **When it stays quiet:** wake-up already logged today, a sick-day Truce today, a prompt already posted today (at most once a day), no arc with the wake-up order, reminders switched off (the master switch), or notifications not allowed.
- **The daily cap:** it is a separate prompt, like the alarm, and does not count toward the 3 reminders a day. It fires only when wake-up isn't logged and at most once a day. It can land on the same morning as "Today's orders" (wake time + 30 min) when the user unlocks before that; the reminder planner doesn't know about it. Open question for the lead: count it toward the cap, or skip "Today's orders" on a day the prompt fired.

## 7. Privacy

- Lock screens are public. Reminder text says **counts only** ("2 orders still open"), never the names of the user's own orders (they may be personal), never weight, calories or selfies.
- The `reminders` channel is created with lock-screen visibility **private**: the lock screen shows that Vinco sent something; the text shows once unlocked (the user can change this per channel in the phone's settings).
- Everything is planned on the phone. Nothing about the day leaves it.

## 8. Permission flow (Android 13+ `POST_NOTIFICATIONS`)

- **Not at launch.** Asked once, the first time the tabs open with an arc: right after onboarding (and, for people updating, on the first open after the update). `hasAskedPermission` in the reminders store makes sure it's asked unprompted only once.
- **Turning reminders on** in Settings asks again if the phone still can; if it refuses, the master switch stays off.
- **Refused for good:** the Reminders sheet and the Permissions screen say so and offer "Open phone settings". Both reread the permission when the user comes back.
- Android 12 and older allow notifications by default; the dialog never shows there.

## 9. Settings

- `src/stores/remindersStore.ts` (`vinco.reminders`, version 1, sanitised on restore): `isOn` (master, on by default), `kinds` (each on or off), `eveningMinutes` (default 20:30, kept between 16:00 and 22:00), `hasAskedPermission`, `pushToken`.
- Settings, "Your day", **Reminders** opens `RemindersSheet`: the master switch, each kind with one line on when it fires, and the evening time (`TimeField`).
- The Permissions screen's Reminders row is live: status, "Allow", or "Open phone settings".

## 10. Push for admin broadcasts (later)

- **Now:** after a successful plan rewrite, once per app run, `fetchExpoPushToken()` gets the Expo push token with the EAS project id (`extra.eas.projectId`), only when the permission is granted and the app is a development or production build (Expo Go on Android has no push since SDK 53). Failures are ignored (FCM may not be set up). The token is stored on the phone (`pushToken`) and **sent nowhere**.
- **When the app is wired to vinco-backend (backend Phase 4):** send it with `PUT /v1/installs/me/push` on start and whenever it changes.
- **Payload** from the backend: `{ type: 'broadcast', notificationId, url }` in `data`, on the `announcements` channel. A tap follows `url` through the same allow-list.
- **The developer's account step:** a Firebase project, `google-services.json` (path in `app.json` `android.googleServicesFile`), and the FCM V1 service account key uploaded to EAS credentials. Until then `getExpoPushTokenAsync` fails and is ignored.

## 11. Usage events

- `reminder_opened { kind }` is on the backend's allow-list. The tap handler (`useReminderSchedule`) has a TODO at the exact spot: send it once the app sends usage events (backend Phase 4). Broadcast taps send `notificationId` the same way.

## 12. Testing on the phone

- **Expo Go (Android, SDK 57):** local reminders work: scheduling, the permission dialog, channels and taps. Push does not: Expo Go on Android dropped remote notifications in SDK 53, so the push token is skipped there. expo-notifications logs a "not fully supported in Expo Go" warning on start; it is harmless for local reminders. Expo Go shows the notifications under Expo Go's own name and icon.
- **Quick check:** set the evening time a couple of minutes ahead in Settings, Reminders, leave an order open, and lock the phone. Hold the day before it fires and it never arrives.
- **Development build:** everything, including the push token once FCM is set up.

## Files

| File                                                               | Does                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `src/features/notifications/rules.ts`                              | Kinds, numbers, settings and their sanitiser                |
| `src/features/notifications/days.ts`                               | Today's facts and the projected next days                   |
| `src/features/notifications/planner.ts`                            | The plan: candidates, toggles, past, quiet hours, cap       |
| `src/features/notifications/links.ts`                              | Allowed notification paths                                  |
| `src/notifications/`                                               | expo-notifications: scheduler, permission, taps, push token |
| `src/hooks/useReminderSchedule.ts`                                 | Keeps the plan in step; follows taps                        |
| `src/hooks/useReminderControls.ts`, `useNotificationPermission.ts` | Settings sheet and Permissions screen                       |
| `src/components/settings/RemindersSheet.tsx`                       | The Reminders sheet                                         |
| `src/copy/notifications.ts`                                        | Every reminder in three tones, channel names, sheet copy    |
| `src/stores/remindersStore.ts`                                     | The persisted settings                                      |
