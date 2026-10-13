# Orders and tasks

How everything a user does in a day is structured. Three kinds, one rule each. Code follows this file; change this file first if a rule changes.

## The three kinds

| Kind           | Who makes it                 | Counts toward sealing the day  | Goal                      | Lasts                                                    | Lives on                            |
| -------------- | ---------------------------- | ------------------------------ | ------------------------- | -------------------------------------------------------- | ----------------------------------- |
| **Order**      | Vinco's, plus the user's own | **Yes.** Every order must hold | A minimum and a full goal | Every day of the arc                                     | Today, "Your orders"                |
| **Daily task** | The user                     | No                             | Done or not done          | Every day, from the day it's added to the arc's last day | The to-do list, "Every day" section |
| **Day task**   | The user                     | No                             | Done or not done          | One day (today or tomorrow)                              | The to-do list, "Today" section     |

In one sentence: **orders decide the day; tasks help plan it.**

## Orders

### The rule

- Every order has a **minimum** ("Hold the line") and a **full goal** ("Conquer").
- The day is **held** when every order is at least at its minimum. The campaign continues, denarii are paid, and the "Line held" seal card appears.
- The day is **conquered** when every order is at its full goal. Only then does the VINCO stamp land.
- A day with **no orders** is never held (free training can start with none).
- If any order is below its minimum at midnight, the day is **missed** (a Truce can still save the campaign, see the Truce rules in CLAUDE.md). A sick-day Truce called in advance covers the day the same way, and comes back if the day is held anyway.
- Doing part of an order (the minimum, not the full goal) never fails the day. That is the point of the minimum.

### Vinco's orders

Water, wake-up, a protein meal, a workout. Which of them an arc has is stored per arc (`arc_orders` rows):

- **Campaign:** all four, tuned in onboarding. They can't be removed.
- **Free training:** only the ones the user picked (onboarding suggests water and workout). They can be removed and added back in "Orders and to-dos". Wake-up is not offered as an order here; the dawn card still logs sleep every morning.

### The user's own orders

- **Added** in onboarding ("Your daily orders", the +), from Today, or from "Orders and to-dos".
- **Fields:** what ("Drink water"), a unit ("glass") and how many a day (12). Whole numbers from 1 to 9999. Saved as minimum = full goal = how many, so an own order is simply done or not yet. Orders saved before 13 Oct keep their separate minimum.
- **Logging on Today:** a tap adds one unit, up to goals of 20 a day ("3 of 12 glass"); a long press takes one back. A goal over 20 (steps) opens a sheet to type the amount. One tap is enough for small goals, so the core job stays fast.
- **Starts today.** Adding an order makes today harder, never easier. If the stamp already landed today and a new order is added, today is open again until the new order is done (the stamp doesn't land twice).
- **Standing an order down** ("Orders and to-dos"): it still counts today and is gone from tomorrow. Removing an order can never rescue the day in progress. An order added and stood down on the same day is removed entirely.
- **At most 6 own orders**, so Today stays one screen of orders.
- **Past days never change.** A day's result is stored when the day is sealed, so adding or standing down orders never rewrites history.

## Tasks (the to-do list)

Tasks never affect sealing, the campaign, ranks, denarii or Truces. They're a plan, not a promise.

### Daily tasks

- Shown every day from the day added until the arc's last day ("till the campaign ends").
- Ticked once per day. A tick belongs to that day only; tomorrow starts unticked.
- Removing one hides it from today on; past ticks stay in history.
- At most 10.

### Day tasks

- For one day: today, or tomorrow (plan ahead the night before).
- At most 20 per day.
- **Carried over by itself** (13 Oct): a day task left undone on an earlier day moves to today when the app opens, marked "carried over". Remove it if it no longer matters.

## Screens

All three kinds are added through **one sheet** that first asks **"How often?"**: Just today, Tomorrow, Every day, or An order. An order then goes on to its minimum and full goal (the name carries over). Own orders and to-dos are on (`FEATURES`, switched on 10 Oct).

### Today (Veni)

1. Header with the user button (the menu), chips (campaign or the run in free training, the purse), quick logs (selfie, weight, calories).
2. **Your orders:** Vinco's, then the user's own, in the order added; done orders sink to the bottom. "3 of 5 done" by the heading. With no orders, a card suggests water. See [DAY-FLOW.md](DAY-FLOW.md).
3. Seal card (once every order holds).
4. **To-do:** every-day tasks, then today's, up to 5 inline. Tap to tick; **press and hold to edit**; the pencil does the same. "Add to your day", and "See all (8)" or "Manage".

### Orders and to-dos (`/plan`)

One place to control everything, from the user menu ("Orders and to-dos") and from Today's to-do. Segments **Orders | To-do** (`?tab=orders|todo`; the old `/orders` and `/tasks` links redirect here).

- **Orders:** Vinco's with their minimum and full goal, marked "Set by Vinco" (in free training each can be removed, confirmed in a sheet, and the missing ones are offered back); the user's own with "Stand down" (confirmed: "It still counts today, and is gone from tomorrow"); "Add an order" while there's room.
- **To-do:** Every day, Today, Tomorrow. Each row: tap to tick, the cross to remove, hold to edit.

### The task sheet (add and edit)

- **Add** ("Add to your day"): what, and how often. Stays open after each save so several can be added; "Done" closes it.
- **Edit** (hold a task): rename, change how often (Just today, Tomorrow, Every day), **make it an order** (the order step opens with the name; saving adds the order and removes the task in one transaction), or remove.
- Changing how often removes the task from today on and adds it again as asked (one transaction), so the usual limits apply; a tick for today stays when the task still shows today.
- In free training, every-day tasks run until removed (it has no end).
- **Done tasks sink to the bottom** of their list (Today and the full list), open ones first in the order added; unticking brings a task back up. The row slides to its place (no motion with reduced motion on).

## Data (SQLite)

| Table               | Holds                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `arc_orders`        | Which of Vinco's orders an arc has, with their minimum and full goal                             |
| `custom_orders`     | The user's own orders: arc, name, unit, minimum, full goal, first day, last day (or null)        |
| `custom_order_logs` | One row per own order per day: the amount reached                                                |
| `day_logs.result`   | The day's result, stored when sealed (`conquered`, `held`, `missed`). Null before sealing        |
| `tasks`             | Daily and day tasks: title, repeat (`daily` or `once`), day, last day, carried-from day, dropped |
| `task_completions`  | One row per task per day ticked                                                                  |

Rules: whether an order is active on a day is `firstDay <= day` and (`lastDay` is null or `day <= lastDay`). The pure logic is in `src/features/orders/customOrders.ts` and `src/features/tasks/`; the repository functions are in `src/db/customOrders.ts`, `src/db/dayStanding.ts` and `src/db/tasks.ts`.
