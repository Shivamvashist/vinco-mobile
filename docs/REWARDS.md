# Rewards: Labours, Decorations, Gloria and the reward flight (31 Oct 2026)

Wave 5, step D ([TASKS-2026-10-31-wave5.md](TASKS-2026-10-31-wave5.md), section 4). Everything here runs on the phone.

**Wages and bounties.** Held and conquered days, run pay (Stipendium) and focus pay are wages: they land on their own and keep their live-pay and undo rules ([ORDERS-AND-TASKS.md](ORDERS-AND-TASKS.md), [TODAY-AND-FOCUS.md](TODAY-AND-FOCUS.md)). Labours and Decorations are bounties: done first, then claimed by hand, once.

## 1. The HUD

A slim pill at the top right of every tab (beside the user button on Veni, and on `/labours`) with three counters, each an icon and an elastic count:

| Counter     | Role       | Icon   | Tap                     | Source                                 |
| ----------- | ---------- | ------ | ----------------------- | -------------------------------------- |
| Denarii     | `currency` | coin   | `/forum`                | ledger sum minus Forum purchases       |
| Gloria      | `accent`   | laurel | Vidi                    | derived (section 4)                    |
| Truces held | `info`     | shield | a short explainer sheet | the truces table's reserve (read only) |

- **Elastic count:** a change springs slightly past the new value and back, and the icon pulses on a rise. Reduce motion: it just changes.
- **Narrow phones:** `ScreenHeader` moves the accessory to its own row above the title when the title would get less than about 160 pt, so the title never breaks mid-word.
- Code: `components/hud/HudCounters.tsx`, `HudCounter.tsx`, `hooks/useHudCounts.ts`.

## 2. The reward flight

One engine (`components/hud/rewardFlight.ts`), one layer (`RewardFlightLayer`, mounted once in the root layout so it flies over every screen), one registry of counter positions.

```ts
import { launchRewardFlight, launchCoinFlight, measureCentre } from '@/components/hud';

launchRewardFlight({ from: { x, y }, rewards: { denarii?: number; gloria?: number; truces?: number } }): void
launchCoinFlight({ from: { x, y }, amount }): void // thin wrapper: denarii only
measureCentre(view, (point) => ...)                 // a view's centre in window coordinates
```

- **Order:** the claim (claim row, ledger row, Truce row) is written first, then the flight starts. The flight is only the show: a killed app never loses or doubles pay.
- **Motion:** each kind's glyphs (coins, laurel sparks, shields) burst out at the claim button and its amount pops beside it; a 350 ms hold; then each glyph is pulled back and slingshots along an arc on a stiff spring to its own counter, in a short stagger. Each landing ticks that counter; coins land with the `coin` cue, sparks and shields with `tap`, but only the first, every 4th and the last landing of a group give a cue, never closer than 90 ms apart (`shouldCueLanding`), so a big claim never buzzes on and on.
- **The counter during a flight** shows the value from before the claim plus what has landed, never more than the real total, then settles on the total. A flight never holds a counter longer than 3.5 s.
- **Skipped:** with reduce motion (the layer is not ready), for a kind without a counter on screen (each counter registers only while its screen is focused), or when a counter can't be measured. The counters then just change.
- **Pay already in the records** (a focus pays when it completes; its Claim is only the show): `launchRewardFlight({ ..., isAlreadyCounted: true })` counts up from the total minus the reward. The focus result shows its own `HudCounters` (the tabs' counters are off screen under `/focus`), faded in at the Claim and holding the reward back (`held`) until the flight takes over.
- **Reset the journey** clears the sky at once (`clearRewardFlight`).
- `ClaimButton` (`components/hud/ClaimButton.tsx`) does all of this for a claim: write, measure itself, launch.

## 3. Labours ("Labores", tasks to earn)

Pure rules in `features/labours/` (tested). Daily labours are new every day; weekly ones run Monday to Sunday (local day keys, `weekStartOf`).

| Labour              | Type   | Goal    | Denarii | Gloria | Truces | Needs orders |
| ------------------- | ------ | ------- | ------- | ------ | ------ | ------------ |
| Take today's selfie | daily  | 1       | 3       | 10     |        |              |
| Log your weight     | daily  | 1       | 3       | 10     |        |              |
| Focus 25 minutes    | daily  | 25 min  | 5       | 15     |        |              |
| Finish 3 to-dos     | daily  | 3       | 4       | 15     |        |              |
| Conquer the day     | daily  | 1       | 8       | 25     |        | yes          |
| Hold 5 days         | weekly | 5 days  | 30      | 100    |        | yes          |
| Conquer 3 days      | weekly | 3 days  | 20      | 120    | 1      | yes          |
| Focus 3 hours       | weekly | 180 min | 30      | 100    |        |              |
| Wake on time 5 days | weekly | 5 days  | 15      | 50     |        |              |

- **Facts** come from the journey's days (section 5): selfie and weight today, completed focus minutes, to-dos ticked, today conquered, days held or conquered this week (today counts while it holds), wake-ups at or before the arc's planned wake time.
- **States:** `working`, `claimable` (progress reached the goal), `claimed` (this period), `unavailable` (needs orders and today has none: a day with no orders never holds). Both a campaign and free training have Labours.
- **Today's card** (below the orders and the seal card, so the core job stays on top) shows the top three: claimable first, then the highest progress ratio, then daily before weekly; claimed and unavailable ones never. "See all" opens `/labours`, grouped Daily and Weekly with when each resets.
- **Expiry:** the period is worked out from today at claim time, so an unclaimed labour simply expires with its day or week.
- The Forum's Earn tab now opens the Labours and keeps the Aerarium as the list of wages.

## 4. Decorations as achievements (Vici)

Every decoration is listed: earned ones with "Claim +N" until claimed, then "Claimed"; locked ones with their rule, their progress where it can be counted (`Decoration.progress`), and what they pay. Claims pay once, forever (period `forever`).

| Decoration   | Denarii | Gloria | Truces |
| ------------ | ------- | ------ | ------ |
| First seal   | 10      | 30     |        |
| Conqueror    | 20      | 60     |        |
| Proof keeper | 25      | 80     |        |
| Resurgo      | 30      | 100    |        |
| Oath keeper  | 40      | 120    |        |
| Iron week    | 30      | 150    | 1      |
| Halfway      | 100     | 300    | 1      |

A claim checks again, inside its transaction, that the decoration is earned on the active arc right now (`getDecorationsNow`, the same rules as Vici).

**Truces in a reward:** granted only up to `TRUCES.maxHeld` (3). At the cap each Truce is paid as its price (50 denarii) instead, and the reward says so before the claim (`resolveClaimPay`). Both kinds of arc can receive them (free training keeps Truces for a later campaign).

## 5. Gloria ("glory points", XP)

Pure rules in `features/gloria/` (tested). **Derived from the records every time**, so an undo takes it back; only claims store theirs.

| Deed                      | Gloria                                |
| ------------------------- | ------------------------------------- |
| An order at its minimum   | +10                                   |
| An order at its full goal | +5 more                               |
| A conquered day           | +20                                   |
| A to-do done              | +3                                    |
| Focus held to the end     | +1 a minute                           |
| A claim                   | its stated Gloria, on the claim's day |

- **The journey** (`buildJourneyDays`): every day from the first arc's start to today. A day belongs to the newest arc whose dates cover it; its orders are that arc's Vinco orders (current goals) plus its own orders active that day. A sealed day's stored result decides "conquered"; an open day is judged live. A day with no orders has no result and never holds.
- **Vidi:** a Gloria card (the total, this week by day as bars, a dashed line at what a conquered day is worth with today's orders) above the calendar. The calendar tints each day in three steps of the accent (from 1, 40 and 80 Gloria); conquered days stay solid gold, held and missed outlines stay on top of the tint.
- **The day sheet** (calendar tap, and Today's hero tap): the result with Gloria and denarii chips, the selfie thumbnail (a local file, never uploaded), the orders as small rings, each focus session (guard, minutes, held or retreated), to-dos ticked, then body and rest. A day with nothing logged says so plainly.

## 6. Data

Migration `0012_claims`:

```
claims (id, kind 'labour'|'decoration', key, period, day, denarii, gloria, truces, claimed_at)
unique (kind, key, period); index (day)
```

- `period`: the day key (daily), the week's Monday (weekly), or `forever` (decorations). `day`: the local day of the claim (its Gloria and denarii count there).
- **Ledger:** the denarii are a ledger row on the claim's day with reason `labour_<id>` or `decoration_<id>` (`ClaimReason`). The ledger's key is (day, reason); since a claim pays at most once per period of at least a day, two claims never collide, and different labours on one day have different reasons. The insert is plain (no "do nothing on conflict"), so a clash would roll the whole claim back rather than pay nothing. Claim rows are never in `LIVE_LEDGER_REASONS`: claims are never taken back. `sumAwards` and the balance are unchanged.
- **Truces:** a granted Truce is a truces row with reason `claim_<kind>_<id>` (+1) on the claim's day.
- **Transactions:** `claimLabour` and `claimDecoration` (`db/claims.ts`) recompute progress from fresh rows, insert the claim (the unique index refuses a second one: `ClaimError('claimed')`), then the ledger and Truce rows, all in one transaction. Refusals: `incomplete` (not done, or undone since), `claimed`, `unavailable`.
- **Reset:** `clearJourney` deletes the claims with everything else.

## 7. Known limits

- Gloria judges past days' orders against the arc's current goals (as the calendar does); the "conquered" bonus follows the stored sealed result.
- The HUD computes the journey's Gloria on each tab; fine for months of data, worth a shared provider if it ever shows up in profiles.
- The dev day offset moves "today" for labours and claims, like everything else.
