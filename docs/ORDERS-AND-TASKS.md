# Orders and tasks

How everything a user does in a day is structured. Three kinds, one rule each. Code follows this file; change this file first if a rule changes.

## The three kinds

| Kind           | Who makes it                      | Counts toward sealing the day  | Goal                      | Lasts                                                    | Lives on                            |
| -------------- | --------------------------------- | ------------------------------ | ------------------------- | -------------------------------------------------------- | ----------------------------------- |
| **Order**      | Vinco's four, plus the user's own | **Yes.** Every order must hold | A minimum and a full goal | Every day of the arc                                     | Today, "Your orders"                |
| **Daily task** | The user                          | No                             | Done or not done          | Every day, from the day it's added to the arc's last day | The to-do list, "Every day" section |
| **Day task**   | The user                          | No                             | Done or not done          | One day (today or tomorrow)                              | The to-do list, "Today" section     |

In one sentence: **orders decide the day; tasks help plan it.**

## Orders

### The rule

- Every order has a **minimum** ("Hold the line") and a **full goal** ("Conquer").
- The day is **held** when every order is at least at its minimum. The campaign continues, denarii are paid, the VINCO stamp lands.
- The day is **conquered** when every order is at its full goal.
- If any order is below its minimum at midnight, the day is **missed** (a Truce can still save the campaign, see the Truce rules in CLAUDE.md).
- Doing part of an order (the minimum, not the full goal) never fails the day. That is the point of the minimum.

### Vinco's four

Water, wake-up, a protein meal, a workout. Tuned in onboarding. They can't be removed.

### The user's own orders

- **Added** from Today ("Add an order", under the orders) or from Vici, "Your orders".
- **Fields:** a name ("Read"), a unit ("pages"), a minimum (10) and a full goal (30). Whole numbers from 1 to 9999; the full goal is at least the minimum. A yes-or-no order uses the same number for both ("No sugar": 1 day, 1 day).
- **Logging on Today:** one tap moves it up a level (not started, then minimum held, then conquered). A long press moves it back down a level. Same gestures as Vinco's four, and one tap is enough, so the core job stays fast.
- **Starts today.** Adding an order makes today harder, never easier. If the stamp already landed today and a new order is added, today is open again until the new order holds (the stamp doesn't land twice).
- **Standing an order down** (Vici, "Your orders"): it still counts today and is gone from tomorrow. Removing an order can never rescue the day in progress. An order added and stood down on the same day is removed entirely.
- **At most 4 own orders** (8 in all), so Today stays one screen of orders.
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
- **Carry over or drop:** day tasks left unfinished on an earlier day show at the top of the to-do list. Each can be carried over to today or dropped, one by one or all at once. Nothing is carried over without asking.

## Screens

### Today (Veni)

1. Header, chips, tone line (unchanged).
2. **Your orders:** Vinco's four, then the user's own orders, in the order they were added. A ghost "Add an order" row closes the list while there's room. The ring shows held orders out of all orders (for example 5/6).
3. Seal card (once every order holds), selfie tile, **to-do tile**: "To-do · 2 of 5 done · 1 to carry over", or "Plan your day" when empty. The tile opens the to-do list.

### The to-do list (`/tasks`)

- Header "To-do" with the date.
- Carry-over card, when there is anything to carry over.
- **Every day** section: daily tasks, each a row with a check circle; tap to tick or untick.
- **Today** section: day tasks, same rows, carried-over tasks marked "carried over".
- **Tomorrow** section, only when something is planned for tomorrow.
- Each row has a remove button (labelled for screen readers). Removing asks nothing: it's a plan, not a record.
- "Add a task" button opens a sheet: the task, and when ("Every day", "Today", "Tomorrow").
- Empty state: a tone line and the add button.

### Your orders (`/orders`, from Vici)

- Vinco's four with their minimum and full goal, marked "Set by Vinco".
- The user's own orders with their goals and a "Stand down" button (confirmed in a sheet: "It still counts today, and is gone from tomorrow.").
- "Add an order" button while there's room.

## Data (SQLite)

| Table               | Holds                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `custom_orders`     | The user's own orders: arc, name, unit, minimum, full goal, first day, last day (or null)        |
| `custom_order_logs` | One row per own order per day: the amount reached                                                |
| `day_logs.result`   | The day's result, stored when sealed (`conquered`, `held`, `missed`). Null before sealing        |
| `tasks`             | Daily and day tasks: title, repeat (`daily` or `once`), day, last day, carried-from day, dropped |
| `task_completions`  | One row per task per day ticked                                                                  |

Rules: whether an order is active on a day is `firstDay <= day` and (`lastDay` is null or `day <= lastDay`). The pure logic is in `src/features/orders/customOrders.ts` and `src/features/tasks/`; the repository functions are in `src/db/customOrders.ts`, `src/db/dayStanding.ts` and `src/db/tasks.ts`.
