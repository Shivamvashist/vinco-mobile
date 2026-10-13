# Wave 2: the plan

> **Archived 14 Oct 2026.** Built in full on 10 Oct. Wave 3 ([TASKS-2026-10-13.md](../TASKS-2026-10-13.md)) changed parts of it: onboarding now starts from orders (no free training card on the arc step), Settings moved from a fourth tab into the user menu on Today, and to-dos carry over by themselves. Still accurate for the Forum, the Aerarium and the rebuilt Vici.

Seven pieces of work asked for on 10 Oct 2026, planned UX first. Each section says what the user sees, the rules, and where it lives in code. Build order is at the end. Related specs: [ORDERS-AND-TASKS.md](../ORDERS-AND-TASKS.md), [GUARDIANS.md](../GUARDIANS.md) (Pax, Vigil, Guard, Imperium and Aurora), [BACKEND-PLAN.md](../BACKEND-PLAN.md).

## 1. Free training (the open plan, no streak)

**Name:** **Free training** (renamed from "free training" on 10 Oct for simplicity). Plain, says what it is: the same orders with nothing at stake. In code the arc kind is still `ludus` (stored in the database); every screen says "Free training".

**Where it's chosen**

- Onboarding step I ("How long is your campaign?") gets a fourth card under 30, 60 and 90: **"Free training"**, "No streak, no fall. Train at your own pace." Picking it changes the summary card to "Starts today. No end date."
- Vici, at any time: in free training, a card **"Ready for a campaign?"** starts a 30, 60 or 90 day campaign from today (orders and wake time carry over). In a campaign, a quiet **"Switch to free training instead"** ends the campaign without a loss screen (confirmed in a sheet).
- When a campaign reaches its last day, Vici and Today show **"Campaign complete"** with two ways on: "Begin another campaign" or "Switch to free training".

**What changes in free training**

| Thing                                      | Campaign      | Free training                                       |
| ------------------------------------------ | ------------- | --------------------------------------------------- |
| Orders, dawn, stamp, seal card, proof, log | Yes           | Yes, the same                                       |
| Campaign (days in a row), the flame chip   | Yes           | No. A "12 days trained" chip instead                |
| Missed day                                 | Breaks it     | Just a day off. No loss screen, no Truce banner     |
| Truces, sick day                           | Yes           | Not needed, hidden. Truces held stay for later      |
| Denarii                                    | Held, weekly  | Held and conquered days pay; no campaign-week bonus |
| Ranks                                      | Yes           | Yes (completed days still count)                    |
| Header                                     | DAY XII OF LX | LUDUS · DAY XII                                     |
| Calendar, Commentarii                      | Arc range     | From the first day trained to today                 |

**Data:** `arcs.kind` (`campaign` or `ludus`, migration 0007). A free-training arc stores `LUDUS_LENGTH_DAYS` as its length (an end far enough never to arrive), so every date range keeps working; screens branch on `kind`, never on the number.

## 2. Your own to-dos: orders, every day, just today

The structure from ORDERS-AND-TASKS.md stays (orders decide the day; tasks plan it). What changes is how they're reached and controlled, so it feels like one system:

**Today (Veni)**

- Under the orders: a **"To-do"** section listing today's items inline (every-day tasks first, then today's), each a one-tap check. Up to 5 show; "See all (8)" opens the list. Carry-over shows as one line ("2 left from yesterday · Sort out").
- One **"+ Add"** row at the end opens the **Add sheet**, which asks one question first: **"How often?"**
  - **Just today** (day task), with "Today / Tomorrow".
  - **Every day** (daily task, until the campaign ends; in free training, until removed).
  - **An order** (counts toward the day): adds the minimum and full goal fields.
- The orders list keeps its own **"Add an order"** ghost row while there's room.

**Control (one place for everything): "Your orders and to-dos"** (`/plan`, from Settings and from "See all")

- Segments **Orders | To-do**. Orders: Vinco's four (fixed) and your own with "Stand down". To-do: every day, today, tomorrow, carry-over.
- **Tap a task** to open its sheet: rename, **change how often** (Just today, Every day, or Make it an order: opens the order fields with the name filled in, then the task is replaced by the order), move to tomorrow, remove.
- Rules unchanged: up to 4 own orders, 10 every-day tasks, 20 per day; an order starts today and stands down from tomorrow; tasks never affect sealing.

## 3. Denarii: the Treasury and the Forum

One screen, **the Forum** (`/forum`), reached from the denarii card in Vici and the denarii chip on Today. Balance at the top in silver ("120 denarii"), then segments:

**Shop** (the Forum)

| Item                      | Latin (plain)         | Price | Rules                                                                       |
| ------------------------- | --------------------- | ----- | --------------------------------------------------------------------------- |
| Truce                     | Truce (rest day)      | 50    | Into the reserve. Max 3 held, one bought per day                            |
| Alarm pass                | "Venia" (pardon)      | 40    | Stops Aurora once without its mission. Max 2 held. Used when Aurora arrives |
| App icons: Laurel, Marble | Insignia (icons)      | 200   | Cosmetic. Owned now; switching needs the native build (see GUARDIANS.md)    |
| Day card frames           | Gold laurel, Porphyry | 150   | Cosmetic. Applied on the day card straight away                             |

Buying: tap an item, a sheet shows price, balance after and the limits, then **"Buy for 50"**. Can't afford: the button reads "Need 20 more" and is disabled. Owned cosmetics read "Owned · Use".

**Earn** (the Aerarium, the treasury): every way to earn, with amounts, and which are live now: day held 5, day conquered 10, every 7 days of campaign 25; coming with Aurora (first try 2), the Vigil (under the reel budget 3) and decorations. Plus "This week: 45 earned".

**History:** the ledger, newest first: "+10 Day conquered · 9 Oct", "-50 Truce · 8 Oct".

**Rules:** denarii are earned, never sold for real money. No debt. Purchases are one transaction (balance, item, inventory together). Balance = earned minus spent.

**Data:** `purchases` (item, price, day) and `item_uses` (item, day), migration 0008. Balance is the ledger sum minus purchases.

## 4. Settings tab and a full Vici

**A fourth tab: "Castra · Settings"** (a _castra_ is the camp where the legion set up). Contents, in sections:

- **You:** Tone, Appearance, Sounds (note: "The seal and the stamp always play"), Vibration, Selfie outline strength.
- **Your day:** Your orders and to-dos, Wake-up time.
- **Guard** (preview): the four levels Pax, Vigil, Guard, Imperium with what each does, and Aurora alarm setup. Marked "Arrives with the Vinco build" until the native parts exist (GUARDIANS.md).
- **Your oath** (listen from Day X).
- **Journey:** Sound the retreat.
- **About:** version. **Dev mode** (dev builds and preview APKs only).

**Vici becomes the record of the whole journey:**

1. Header: arc name, dates (or "Free training, since 3 Oct").
2. Journey line (campaign) or the training stats (free training).
3. Rank card.
4. **Campaign stats** grid: current campaign, best campaign, days conquered, days held, Truces used, selfies.
5. **Treasury card:** denarii, Truces held, alarm passes, "Visit the Forum".
6. **Decorations:** earned in gold, locked ones outlined with how to earn them (First seal, Conqueror, Iron week, Resurgo, Halfway to Rome, Proof keeper).
7. All your proof (timelapse of every selfie).
8. **Past arcs:** each earlier campaign or free training with its dates and days completed.
9. The campaign choice (start a campaign, train in free training, or what next after a finished campaign).

## 5. Sounds

- **Tab whoosh:** a new quietest tier (`whisper`, about -16 dBFS) and shorter, so switching tabs is felt more than heard.
- **Always-on moments:** the **seal** (DAY I stamp on the first selfie) and the **stamp** (a conquered day) play even with Sounds off. They are the two moments the app is built around. The phone's own silent mode still wins. The theme lists them in `feedback.essential`.

## 6. Fits every phone

- **Onboarding step II (orders):** the "Conquer" stepper sat in half a card and cut "2 L" to "2...". On narrow screens (under about 400 dp, adjusted for the user's font size) the minimum and the stepper stack; values shrink to fit rather than truncate.
- **Step V and the daily selfie:** the camera frame no longer has a fixed 420 height. Before the shot, the screen doesn't scroll: the frame takes the space left (flex), so the shutter is always on screen. The timelapse frame does the same.
- Rule added to CONVENTIONS: no fixed heights for large media; flex or a share of `useWindowDimensions`.

## 7. Guard levels and Aurora (base now, native later)

Full plan in [GUARDIANS.md](../GUARDIANS.md). Built now: the types, pure rules, saved settings, the Settings screens (preview state) and the bridge interfaces that native modules will fill later.

## Build order

1. Sounds (small, unblocks nothing).
2. Responsive fixes.
3. Settings tab (moves settings out of Vici).
4. Free training.
5. Forum and the economy.
6. Vici rebuilt (needs 4 and 5).
7. To-dos switched on with the new UX.
8. Guard and Aurora base.
9. Backend plan.
