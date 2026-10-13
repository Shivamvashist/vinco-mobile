# Backend plan (vinco-api)

What the server and its database will need, built from what the app already keeps on the phone, and which features can only exist once it does. Written 10 Oct 2026 for when the UI prototype is final. Stack from [v1-docs/PLAN.md](v1-docs/PLAN.md) section 11.

## 1. Principles

1. **Local first.** The phone stays the source of truth for the day. Opening the app, ticking orders and sealing never wait for the network. The server is backup, the shared world (squads), and the referee for anything worth cheating at (denarii).
2. **Selfies never leave the phone.** Not uploaded, not analysed. An opt-in encrypted backup (1.1) stores ciphertext only; the key stays with the user.
3. **The server decides money.** Denarii, the Forum and the Tributum are recomputed and stored on the server once accounts exist. The phone shows a cached balance and sends facts (orders logged, days sealed), never amounts.
4. **One contract.** An OpenAPI spec in `vinco-api` is the contract; the app generates its client and types from it. All routes under `/v1/`.
5. **Degrade quietly.** With no network, everything that doesn't need the server keeps working; social features show "Offline" and retry.

## 2. Stack

| Layer           | Choice                                                                     |
| --------------- | -------------------------------------------------------------------------- |
| API             | Hono on Node, REST, Zod validation, OpenAPI generated from the Zod schemas |
| Hosting         | Google Cloud Run, Mumbai (asia-south1)                                     |
| Database        | Postgres on Supabase Mumbai, used as plain Postgres through Drizzle        |
| Auth            | Better Auth: Google first, phone OTP after India's SMS DLT registration    |
| Jobs            | Cloud Scheduler hitting job endpoints (weekly report, squad standings)     |
| Push            | Firebase Cloud Messaging through Expo push tokens                          |
| Media (later)   | Cloudflare R2, encrypted selfie backups only (1.1, opt-in)                 |
| AI              | Claude API, server-side only (step one, morning brief, Senate report)      |
| Remote config   | A table plus an endpoint (Vigil detection rules, prices, flags)            |
| Errors, product | Sentry (app and API), PostHog                                              |
| Admin           | Next.js dashboard on the same API                                          |

The app adds **TanStack Query** for server data (the stated plan), keeps **Drizzle and SQLite** for records and **Zustand** for UI state.

## 3. Data: what moves to the server

Every table the phone has today maps across. New columns on the phone before sync: a client-generated **UUID** `id` on every synced row (today some tables use integer ids or (day, reason) keys), `updated_at`, and `deleted_at` (soft delete, so deletions sync).

| Phone table today                   | Server table                                         | Sync rule                                                                                        |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| (none)                              | `users`, `devices`, `sessions`                       | Created by auth. `devices` holds the push token and Play Integrity verdicts                      |
| `arcs`, `arc_orders`                | `arcs`, `arc_orders`                                 | Last write wins per row. Kind (`campaign`, `ludus`), length, start day, wake time, status        |
| `order_logs`                        | `order_logs`                                         | Per (user, day, kind): the higher `updated_at` wins. Amounts capped by the same rules as the app |
| `custom_orders`, `..._logs`         | same                                                 | As above                                                                                         |
| `day_logs`                          | `day_logs` **without `selfie_path`**                 | Woke, slept, weight (private), sealed at, stored result, Truce used                              |
| `ledger`                            | `ledger` (**server-written**)                        | The server recomputes awards from sealed days; the phone's ledger becomes a read cache           |
| `truces`                            | `truces` (**server-written**)                        | Calls go through the API when online; offline calls queue and are confirmed later                |
| `purchases`, `item_uses`            | same (**server-written**)                            | Buying needs the network once accounts exist (it's money)                                        |
| `tasks`, `task_completions`         | same                                                 | Optional sync (a plan, not a record). Last write wins                                            |
| Zustand: tone, theme, guard, Aurora | `user_settings` (JSON, versioned)                    | Last write wins. Restores a new phone                                                            |
| (Vigil, native)                     | `reel_days` (user, day, count, minutes, over_budget) | Daily totals only, never what was watched                                                        |

New on the server only:

| Table                                      | For                                                  |
| ------------------------------------------ | ---------------------------------------------------- |
| `squads`, `squad_members`, `squad_invites` | Contubernium: up to 8, invite codes, roles           |
| `squad_standings` (per week)               | Fewest reels, most days held; computed by a job      |
| `decorations_awarded`                      | Server-confirmed honours (and their denarii)         |
| `reports` (weekly)                         | The Senate report, generated Sunday                  |
| `remote_config`                            | Vigil detection rules per app version, prices, flags |
| `notifications_log`                        | Enforces "three nudges a day" across devices         |
| `audit_events`                             | Admin and anti-cheat trail                           |
| `deletion_requests`                        | Account deletion (a Play requirement)                |

## 4. Sync

- **Outbox on the phone:** every write to a synced table also writes an outbox row (table, id, operation). A background flush sends batches to `POST /v1/sync/push` when online.
- **Pull:** `GET /v1/sync/pull?cursor=...` returns rows changed since the cursor, across tables. The phone applies them in one transaction.
- **First sign-in:** `POST /v1/sync/bootstrap` uploads the whole local history once (arcs, days, logs), and the server rebuilds the ledger from it. After that, the server's ledger wins.
- **Conflicts:** settings and plans are last write wins; logs keep the newest `updated_at`; sealed results never change once both sides have them (the product rule "sealed days never change" holds on the server too).
- **Clock trust:** the server records its own receive time; days are still the user's local day keys (they travel with the timezone).

## 5. Endpoints (v1)

| Area    | Endpoints                                                                                                                           |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Auth    | Better Auth routes; `GET /v1/me`; `DELETE /v1/me` (starts deletion)                                                                 |
| Sync    | `POST /v1/sync/bootstrap`, `POST /v1/sync/push`, `GET /v1/sync/pull`                                                                |
| Economy | `GET /v1/treasury` (balance, history), `POST /v1/forum/purchases`, `POST /v1/truces` (call), `POST /v1/tributum`                    |
| Squads  | `POST /v1/squads`, `POST /v1/squads/join` (code), `GET /v1/squads/:id`, `GET /v1/squads/:id/standings`, `POST /v1/squads/:id/pokes` |
| Reports | `GET /v1/reports/weekly/latest`                                                                                                     |
| AI      | `POST /v1/step-one` (a goal into a 15-minute step), `GET /v1/brief/today`                                                           |
| Config  | `GET /v1/config` (remote config for this app version)                                                                               |
| Devices | `PUT /v1/devices/:id` (push token, platform, app version, integrity token)                                                          |
| Admin   | `/v1/admin/*` behind a separate role                                                                                                |

## 6. Trust and anti-cheat

- **Play Integrity** token on sign-in and on money endpoints.
- **Recompute, don't accept:** the server derives each day's result and awards from the logged facts and the same rules as `src/features/campaign` (share the pure rules as a package, or port them with the same tests).
- **Limits:** per-day caps (one Forum Truce a day, three Tributum), rate limits, and sanity checks (no water logged at 40 L, no days before the account existed being sealed late beyond the Truce window).
- **Leaderboards** only count server-confirmed days.

## 7. Features that need the backend

Can't ship without it:

1. **Accounts and restore:** a new phone gets the journey back (except selfies, unless the 1.1 backup is on).
2. **Squads (Contubernium):** invites, shared standings, pokes, the squad pact.
3. **Server ledger:** the Forum and Tributum with real trust; decorations that pay.
4. **Senate report:** the weekly recap, generated by a job (with AI wording in the user's tone).
5. **AI step one and the morning brief:** Claude API calls stay server-side (keys never ship in the app).
6. **Remote config for the Vigil:** fix detection for an app's new layout without a release.
7. **Server push:** squad pokes and the weekly report (daily nudges stay local).
8. **Encrypted selfie backup** (1.1, opt-in).
9. **Admin and support:** look up a user, refund a mistaken purchase, handle deletion.
10. **Analytics** tied to accounts (retention by arc length, free training versus campaign).

Already fine on the phone alone: orders, sealing, campaign, Truces (local), free training, decorations (computed), the Forum (local ledger, Early Access), selfies, timelapse, logs, guard and Aurora (native, local).

## 8. Order of work

1. **Before any API:** add UUIDs, `updated_at`, `deleted_at` and the outbox to the phone's tables (one migration), still local only. Low risk, unblocks everything.
2. API skeleton: Hono, Zod, OpenAPI, Drizzle schema mirroring section 3, health check, Cloud Run deploy, Sentry.
3. Auth (Google) and `devices`; `GET /v1/me`.
4. Sync bootstrap, push and pull; the app's sign-in screen (in Settings, "Back up your journey").
5. Server ledger and economy endpoints; the app reads the balance from the server when signed in.
6. Remote config; squads; weekly report job; AI endpoints.
7. Encrypted backup (1.1).

## 9. What the app will change

- A **sign-in** entry in Settings (optional: the app stays fully usable without an account, which keeps the core job offline and fast).
- TanStack Query hooks for server data (squads, reports, treasury when signed in); Drizzle live queries stay for local records.
- An `api/` folder generated from the OpenAPI spec.
- The Forum: when signed in, buying calls the API; offline, it says "Needs a connection".
