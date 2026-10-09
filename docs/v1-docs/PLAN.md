# Vinco: product plan

Plan as of 7 October 2026. The UI prototype (design canvas) shows every screen described here.

## 1. Overview

**Vinco uses your phone to beat your phone.** An Android app for people running a 30, 60 or 90 day arc: four non-negotiable daily orders, a daily selfie as proof, and (from 1.0) a live reel counter that steps in when the feed has had enough of your day.

**Who it's for:** 18 to 25, students and early jobbers, mostly in India. The arc starter who drops off in week two; the gym beginner who wants proof; the scroller who knows it and has tapped "ignore limit" a hundred times. Not for under-18s, calorie trackers or teams.

### Releases

| Release              | Date                   | What ships                                                                                                                                                |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Early Access         | 2 Nov 2026             | Tracker: onboarding, four orders, selfie, campaign, Truce, tone picker, oath, day card, ranks, decorations, earning denarii. All on the phone, no backend |
| Vinco 1.0 (full MVP) | 1 Jan 2027             | The Vigil (reel counter), Aurora alarm missions, sign-in, squads, AI step one, Senate report, the Forum and the Tributum                                  |
| 1.1                  | Feb to Mar 2027        | Guard dialogues, slip log, home widget, selfie backup, phone OTP                                                                                          |
| 1.2                  | Spring 2027            | Imperium strict mode, Clementia, season pass                                                                                                              |
| Global               | When squads are active | Global leaderboard, public timelapse posts with moderation                                                                                                |
| iPhone               | When Android pays off  | Tracker, squads, time limits only (Apple doesn't allow a reel counter)                                                                                    |

Google requires new personal developer accounts to run a closed test with 12+ testers for 14 days before going public. Updated builds can be uploaded during the test.

## 2. Brand

- **Name:** Vinco, Latin for "I conquer," present tense. The battle is against yesterday's you. _Vincit qui patitur:_ the one who endures, conquers.
- **Tagline:** Veni, vidi, vici. Veni = show up (Today tab), Vidi = see the proof (Progress tab), Vici = finish the arc (Arc tab).
- **Look:** dark basalt background, marble text, laurel gold for wins, porphyry red for warnings and the reel counter, silver for denarii. Marcellus for big moments, Figtree for everything else. Laurel leaves, wax-seal stamps, a broken column for a lost campaign. Flat and minimal.
- **Rule:** Roman in spirit, modern in use. Every Latin word sits beside a plain label.

### Vocabulary

| In the app                 | Roman name        | Plain label      |
| -------------------------- | ----------------- | ---------------- |
| Start button               | Cross the Rubicon | Begin your arc   |
| Streak                     | Campaign          | Days in a row    |
| Minimum version of a task  | Hold the line     | Minimum          |
| Full version of a task     | Conquer           | Full goal        |
| Campaign-saving pass       | Truce             | Rest day         |
| Restarting within 24 hours | Resurgo           | Comeback         |
| Earned app unlock          | Clementia         | 10-minute unlock |
| Wake-up alarm              | Aurora            | Alarm            |
| Reel counter               | The Vigil         | Reel counter     |
| Strict blocking            | Imperium          | Strict mode      |
| Friends group              | Contubernium      | Squad            |
| Idea library               | The Armory        | Task ideas       |
| Weekly recap               | The Senate report | Weekly review    |
| Currency                   | Denarii           | Coins            |
| Shop                       | The Forum         | Shop             |
| Over-budget fee            | The Tributum      | Over-budget fee  |
| Achievements               | Decorations       | Achievements     |

### Tones

| Tone        | Feels like         | Example: task open at 9pm                              |
| ----------- | ------------------ | ------------------------------------------------------ |
| Philosopher | Calm Stoic teacher | "The day is not over. One small act still counts."     |
| Centurion   | Firm coach         | "Two of four done. Finish the line, soldier."          |
| Roast me    | Sarcastic friend   | "Your water bottle has filed a missing person report." |

Humour rule: roast the habit, the phone and the excuse, never the person. Selfie, weight and slip screens stay neutral. Every sarcastic line ends with a way forward.

## 3. App structure

| Tab  | Label    | Contents                                                               |
| ---- | -------- | ---------------------------------------------------------------------- |
| Veni | Today    | Four orders, step one, own tasks, selfie, to-do list                   |
| Vidi | Progress | Calendar, campaign, sleep, reel totals, selfie history, weight trend   |
| Vici | Arc      | Day X of Y, rank, decorations, squad ranking, denarii, modes, settings |

**A day in Vinco:** Aurora rings and stops only after a mission (photograph the sky). First litre of water. Morning brief in your tone. Tick tasks through the day while the Vigil counts reels. Log the workout by voice. Take the selfie. One evening nudge only if something's open. The VINCO stamp seals the day and the day card is ready to share.

## 4. Onboarding

1. **Cross the Rubicon:** one button under a rotating Stoic quote (Seneca, Marcus Aurelius, Epictetus).
2. **Arc length:** 30, 60 or 90 days, starting today.
3. **Your orders:** the four non-negotiables with minimum and full goal. Numbers adjust; tasks can't be removed.
4. **Wake and sleep times.**
5. **Step one** (optional): a goal and a first 15-minute step.
6. **Tone:** Philosopher, Centurion or Roast me, with a live preview.
7. **The oath:** a 20-second voice note on why. Plays back on Day 10, when most people quit.
8. **Vigil permission** (1.0, optional).
9. **First selfie,** then the "DAY I" stamp.

## 5. The four orders

| Task         | Hold the line                    | Conquer                       | Checked by                       |
| ------------ | -------------------------------- | ----------------------------- | -------------------------------- |
| Water        | 1 L within 30 min of waking      | 4 L, adjustable               | One tap per litre                |
| Wake-up      | Up within 15 min of the alarm    | Up on time, mission first try | Aurora mission                   |
| Protein meal | 1 meal                           | 2, then 3 as you level up     | Tap                              |
| Workout      | 15-minute walk or short home set | 40 minutes                    | Tap, then a 15-second voice note |

- **Meal promotion:** 5 days in a row at full goal offers a step up. Never forced.
- **Step one:** a bigger goal broken into a 15-minute step for today. Templates in Early Access, AI in 1.0.
- **Own tasks:** count toward the stamp only if marked as orders.
- **The Armory:** ready-made tasks (skincare, haircare, reading, journaling, deep study, sunlight, no screens after 11pm). One suggestion a week.

## 6. Aurora, nudges and tracking

- **Aurora missions:** see the sky (photo checked on the phone), reach the post (scan a QR code stuck in the bathroom), march (30 steps). "I'm sick" stops it but uses the Truce.
- **Nudges, max three a day:** morning brief, evening check (only if something's open), wind-down 30 minutes before bed.
- **Sleep:** wake time from Aurora, bedtime from the wind-down tap or last phone use.
- **To-do list:** separate from the arc; unfinished items ask "carry over or drop?"
- **Selfie:** daily, with yesterday's outline as a guide. Never leaves the phone. Weight optional, weekly trend only. Timelapse at Day 30.

## 7. The Vigil (Vinco 1.0)

Counts reels and shorts (Instagram Reels, YouTube Shorts) via Android's Accessibility API.

- **Floating badge:** a draggable pill with the count. Marble, then gold, then porphyry past the budget.
- **Tap panel:** today's count and minutes, versus yesterday, squad top 3 (fewest reels wins), "Leave the arena" or "Keep watching."
- **Milestones** (every 25 by default): 25 = a Stoic quote; 50 = a 10-second nudge video plus open tasks; 75 = time lost in real terms; 100 = a firm card and a lower budget offer. Cards can be closed after 5 seconds.
- **More:** daily budget, first-reel timer, night watch (reels after bedtime), doomscroll detection, clean-day campaign, squad pact.
- **Privacy promise:** reads only whether a reels screen is open and when a new video starts. Never reads messages, captions, usernames, passwords or video content. Nothing on screen is saved or sent.
- Detection rules live in remote config, so layout changes in other apps can be fixed without a release.

## 8. Modes

| Mode     | Does                                           | Ships               |
| -------- | ---------------------------------------------- | ------------------- |
| Pax      | Tracker only                                   | 1.0                 |
| Vigil    | Count reels, milestones, later guard dialogues | 1.0 (dialogues 1.1) |
| Imperium | Blocks chosen apps after a limit               | 1.2                 |

- **Guard dialogues (1.1):** a Roman guard pops up when opening a marked app ("Instagram, again? That's the 14th time today"), then asks why: reply to someone, look something up, or just bored (which offers a task).
- **Imperium (1.2):** limits by time or reels; frozen until midnight; Clementia (finish all orders) earns a free 10-minute unlock; turning it off takes 24 hours; calls, contacts, payments and maps are never blocked.

## 9. Economy and honours

**Rule: denarii are earned, never sold for real money.** Ranks and decorations can't be bought either.

### Earning denarii

| Action                   | Denarii   |
| ------------------------ | --------- |
| Day sealed at minimum    | 5         |
| Day sealed at full goal  | 10        |
| Aurora first try         | 2         |
| Under reel budget        | 3         |
| Every 7 days of campaign | 25        |
| Decorations              | 10 to 100 |
| Rank promotion           | Bonus     |

A good week earns about 125.

### The Forum

| Item                       | Price              | Limits                                                                                              |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| Extra Truce                | 50                 | Bought only at the moment of need (Early Access: see `TRUCES` in `src/features/campaign/truces.ts`) |
| Campaign rescue            | 5 per campaign day | Within 24 hours of a miss, one a week                                                               |
| Day card frames, app icons | 150 to 250         | Cosmetic only                                                                                       |

### The Tributum

Going over the reel budget costs 15 denarii for 10 more reels, doubling each time that day (15, 30, 60), at most three times. No debt: at zero, the option disappears. In 1.2, early Imperium unlocks work the same way.

### Ranks and decorations

- **Ranks** (by days completed, thresholds to tune): Tiro (1), Miles (4), Optio (10), Centurion (20), Tribune (35), Legate (50), Consul (60), Caesar (90-day arc).
- **Decorations** (by deeds): Aurora's favourite, Aqueduct, Iron week, Iron ration, Monk mode, Night watchman, Resurgo, Halfway to Rome, Contubernium, First seal, Oath keeper, and a hidden Roast-mode one.

### Shipping

Early Access: ranks, decorations, denarii earning (local ledger). 1.0: the Forum and the Tributum, server ledger. 1.2: Tributum on Imperium.

## 10. Extras

| Feature                              | When                |
| ------------------------------------ | ------------------- |
| Day card (shareable "DAY XII OF LX") | Early Access        |
| The oath                             | Early Access        |
| Resurgo comeback                     | Early Access        |
| Days left in the year                | Early Access        |
| Squads (up to 8, invite code)        | 1.0                 |
| Senate report (Sunday recap)         | 1.0                 |
| Slip log (private, on phone)         | 1.1                 |
| Home-screen widget                   | 1.1                 |
| Finish screen and timelapse          | Timelapse by Day 30 |

## 11. Tech

| Layer                | Choice                                                                           |
| -------------------- | -------------------------------------------------------------------------------- |
| Repos                | Two: `vinco-mobile` (this) and `vinco-api` (later)                               |
| App                  | React Native, Expo, TypeScript, Expo Router, npm                                 |
| Native parts (later) | Kotlin modules via the Expo Modules API: Vigil, badge overlay, Aurora, timelapse |
| Phone database       | expo-sqlite                                                                      |
| API (later)          | Hono on Node, REST, Zod, OpenAPI spec as the contract, `/v1/` versioning         |
| API hosting          | Google Cloud Run, Mumbai                                                         |
| Database (later)     | Postgres on Supabase Mumbai, used as plain Postgres via Drizzle                  |
| Auth (later)         | Better Auth: Google first, phone OTP after India's SMS DLT registration          |
| Media (later)        | Cloudflare R2                                                                    |
| Push                 | Firebase Cloud Messaging via Expo Notifications                                  |
| Payments (later)     | RevenueCat                                                                       |
| Analytics, errors    | PostHog, Sentry                                                                  |
| Admin (later)        | Next.js dashboard                                                                |
| Builds               | EAS Build; EAS Update for JavaScript fixes                                       |

### Where data lives

| Data                                                            | Where                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------ |
| Tasks, logs, sleep, to-dos, voice notes, reel events            | Phone                                                        |
| Selfies                                                         | Phone only; optional backup to the user's Google Drive (1.1) |
| Profile, arc summary, daily totals, squads, ledger, decorations | Server (from 1.0)                                            |

### Permissions (asked one at a time, when needed)

Accessibility (Vigil, needs a Play declaration and video), display over other apps (badge), exact and full-screen alarms (Aurora), camera, microphone, physical activity, notifications.

## 12. Risks

| Risk                                                | Fallback                                                        |
| --------------------------------------------------- | --------------------------------------------------------------- |
| Google rejects the Accessibility declaration        | Submit early (mid-Nov). Fallback: time per app via usage access |
| Instagram/YouTube layout changes                    | Remote detection rules                                          |
| Xiaomi, Oppo, Vivo, Realme kill background services | Battery-optimisation guide in onboarding                        |
| Scope too big for 1 January                         | Move squads and AI step one to 1.1                              |
| Leaderboard and denarii cheating                    | Play Integrity checks, server-side ledger and limits            |
| Under-18 users                                      | Adults-only rating                                              |

## 13. Open decisions

- Studio name and the real Android package name (before the first Play upload)
- Play Console account
- Rank thresholds, Forum prices and earn rates (tune with Early Access data)
- Squads in 1.0 or 1.1
- Season pass price
